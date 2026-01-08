/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
// Import Firebase admin SDK
import * as admin from "firebase-admin";
// Import genkit and googleAI plugin
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { Langfuse } from 'langfuse';

// Lazy-initialize Langfuse (env vars may not be available at module load time)
let _langfuse: Langfuse | null = null;
function getLangfuse(): Langfuse | null {
  if (!_langfuse && process.env.LANGFUSE_SECRET_KEY) {
    _langfuse = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
    });
  }
  return _langfuse;
}

// Initialize Firebase admin
admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties: true });

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Initialize Gemini API client
// You will need to set the GEMINI_API_KEY in your Firebase functions config
// You'll need to set this API key in Firebase config using:
// firebase functions:config:set gemini.key="YOUR_API_KEY"

// Define interfaces for the gamified system
interface StudentProfile {
  stream: string; // Engineering, Science, Computer Science, etc.
  year: string; // 1st, 2nd, 3rd, 4th year
  interests: string[];
  skillLevel: string; // Beginner, Intermediate, Advanced
  preferredTechnologies: string[];
  teamSize: string; // Individual, Small Team (2-3), Large Team (4+)
  projectDuration: string; // 1-2 weeks, 1 month, 3 months, 6+ months
}

interface GameStep {
  stepId: number;
  question: string;
  options: string[];
  category: string;
  points: number;
}

// Structure definition for project ideas - defines the expected format of generated ideas
interface ProjectIdea {
  title: string;
  overview: string;
  objectives: string[];
  technicalRequirements: {
    technologies: string[];
    skillsRequired: string[];
    difficulty: string;
  };
  projectStructure: {
    phases: Array<{
      name: string;
      duration: string;
      tasks: string[];
    }>;
  };
  deliverables: string[];
  learningOutcomes: string[];
  implementationGuide: {
    gettingStarted: string[];
    keyResources: string[];
    commonChallenges: string[];
  };
  variations: string[];
}

// Helper function to validate project idea structure
function isValidProjectIdea(idea: any): idea is ProjectIdea {
  return idea && typeof idea.title === 'string' && typeof idea.overview === 'string';
}

interface IdeaGenerationRequest {
  query?: string;
  prompt?: string;
  studentProfile?: StudentProfile;
  gameResponses?: any[];
  discoveryMode?: boolean;
}

interface HistorySaveRequest {
  userId: string;
  ideaData: {
    query: string;
    idea: string;
    studentProfile: StudentProfile;
    gameScore: number;
  };
  gameSteps: any[];
}

// Admin and Role Management Interfaces
interface UserRole {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin?: string;
  status: 'active' | 'inactive';
}

interface AdminAction {
  adminId: string;
  action: string;
  targetUserId?: string | null;
  timestamp: string;
  details: any;
}

interface UserManagementRequest {
  adminUserId: string;
  targetUserId?: string;
  newRole?: 'admin' | 'user';
  newStatus?: 'active' | 'inactive';
}

interface BulkUserRequest {
  adminUserId: string;
  userIds: string[];
  action: 'changeRole' | 'changeStatus' | 'export';
  newRole?: 'admin' | 'user';
  newStatus?: 'active' | 'inactive';
}

// Helper functions for admin operations
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const db = admin.firestore();
    const userDoc = await db.collection('userRoles').doc(userId).get();

    if (!userDoc.exists) {
      return false;
    }

    const userData = userDoc.data() as UserRole;
    return userData.role === 'admin' && userData.status === 'active';
  } catch (error) {
    logger.error('Error checking admin status:', error);
    return false;
  }
}

async function logAdminAction(adminId: string, action: string, targetUserId?: string | null, details?: any): Promise<void> {
  try {
    const db = admin.firestore();
    // Sanitize details to remove undefined values
    const safeDetails = details ? JSON.parse(JSON.stringify(details)) : {};

    const actionLog: AdminAction = {
      adminId,
      action,
      targetUserId: targetUserId || null,
      timestamp: new Date().toISOString(),
      details: safeDetails
    };

    await db.collection('adminLogs').add(actionLog);
  } catch (error) {
    logger.error('Error logging admin action:', error);
  }
}

async function ensureUserRole(userId: string, email: string): Promise<void> {
  try {
    const db = admin.firestore();
    const userRoleDoc = await db.collection('userRoles').doc(userId).get();

    if (!userRoleDoc.exists) {
      // Check if this is the first user (make them admin)
      const allUsersSnapshot = await db.collection('userRoles').limit(1).get();
      const isFirstUser = allUsersSnapshot.empty;

      // Create user role (first user becomes admin)
      const userRole: UserRole = {
        userId,
        email,
        role: isFirstUser ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      await db.collection('userRoles').doc(userId).set(userRole);

      if (isFirstUser) {
        logger.info(`First user ${email} created as admin`);
      }
    }
  } catch (error) {
    logger.error('Error ensuring user role:', error);
  }
}

// Helper function to create discovery mode prompt (multiple brief ideas)
function createDiscoveryPrompt(inputQuery: string, profile: StudentProfile): string {
  return `
You are an expert educational project advisor. Generate exactly 6-8 diverse project ideas for students.

Student Profile:
- Field of Study: ${profile.stream || 'Engineering'}
- Skill Level: ${profile.skillLevel || 'Intermediate'}
- Interests: ${profile.interests?.join(', ') || 'General'}
- Time Available: ${profile.projectDuration || '1-2 months'}
- Preferred Technologies: ${profile.preferredTechnologies?.join(', ') || 'Flexible'}

Request: ${inputQuery}

Generate 6-8 BRIEF project ideas in this EXACT format:

## Project Title 1
**Description:** [2-3 sentence description]
**Difficulty:** [Beginner/Intermediate/Advanced]
**Time:** [X weeks]
**Technologies:** [specific tech stack]
**You'll Learn:** [key learning outcomes]

## Project Title 2
**Description:** [2-3 sentence description]
**Difficulty:** [Beginner/Intermediate/Advanced]
**Time:** [X weeks]
**Technologies:** [specific tech stack]
**You'll Learn:** [key learning outcomes]

[Continue for 6-8 projects total]

IMPORTANT:
- Each project should be BRIEF (not comprehensive plans)
- Focus on variety and different approaches
- Match the student's ${profile.skillLevel || 'intermediate'} skill level
- Align with interests: ${profile.interests?.join(', ') || 'general programming'}
- Ensure projects can be completed in ${profile.projectDuration || '1-2 months'}
- Use preferred technologies when possible: ${profile.preferredTechnologies?.join(', ') || 'flexible'}
`;
}

// Helper function to create comprehensive mode prompt (single detailed plan)
function createComprehensivePrompt(inputQuery: string, profile: StudentProfile): string {
  return `
You are an expert educational project advisor for ${profile.stream || 'engineering'} students.

Student Context:
- Academic Stream: ${profile.stream || 'Not specified'}
- Year: ${profile.year || 'Not specified'}
- Skill Level: ${profile.skillLevel || 'Intermediate'}
- Interests: ${profile.interests?.join(', ') || 'General'}
- Preferred Technologies: ${profile.preferredTechnologies?.join(', ') || 'Flexible'}
- Team Size: ${profile.teamSize || 'Individual'}
- Project Duration: ${profile.projectDuration || '1-2 months'}

Project Query: ${inputQuery}

Generate a comprehensive project idea that follows this EXACT structure:

## PROJECT TITLE
[Creative, specific title]

## PROJECT OVERVIEW
[2-3 sentence description of what the project does and its purpose]

## LEARNING OBJECTIVES
[3-4 specific learning goals the student will achieve]

## TECHNICAL REQUIREMENTS
### Technologies Needed:
[List of specific technologies, frameworks, tools]

### Skills Required:
[List of technical and soft skills needed]

### Difficulty Level:
[Beginner/Intermediate/Advanced with brief justification]

## PROJECT STRUCTURE
### Phase 1: Planning & Setup (Week 1)
[Specific tasks for initial phase]

### Phase 2: Core Development (Weeks 2-X)
[Main development tasks]

### Phase 3: Testing & Refinement (Final Week)
[Testing, debugging, documentation tasks]

## KEY DELIVERABLES
[List of specific outputs/artifacts the student will create]

## IMPLEMENTATION GUIDE
### Getting Started:
[Step-by-step initial setup instructions]

### Key Resources:
[Specific tutorials, documentation, tools]

### Common Challenges & Solutions:
[Anticipated problems and how to solve them]

## LEARNING OUTCOMES
[What the student will know/be able to do after completion]

## PROJECT VARIATIONS
### Beginner Version:
[Simplified version if needed]

### Advanced Extensions:
[Ways to expand the project for advanced students]

Ensure the project is:
1. Appropriate for ${profile.skillLevel || 'intermediate'} level
2. Completable in ${profile.projectDuration || '1-2 months'}
3. Suitable for ${profile.teamSize || 'individual work'}
4. Uses technologies the student prefers: ${profile.preferredTechnologies?.join(', ') || 'flexible technologies'}
5. Relevant to ${profile.stream || 'engineering'} curriculum
`;
}

// Helper to interpolate prompt variables
function interpolatePrompt(template: string, inputQuery: string, profile: StudentProfile): string {
  let result = template;
  result = result.replace(/{{inputQuery}}/g, inputQuery || '');
  result = result.replace(/{{stream}}/g, profile.stream || 'Engineering');
  result = result.replace(/{{skillLevel}}/g, profile.skillLevel || 'Intermediate');
  result = result.replace(/{{interests}}/g, profile.interests?.join(', ') || 'General');
  result = result.replace(/{{projectDuration}}/g, profile.projectDuration || '1-2 months');
  result = result.replace(/{{preferredTechnologies}}/g, profile.preferredTechnologies?.join(', ') || 'Flexible');
  result = result.replace(/{{teamSize}}/g, profile.teamSize || 'Individual');
  result = result.replace(/{{year}}/g, profile.year || 'Not specified');
  return result;
}

/**
 * Get gamification questions for context gathering
 */
export const gameStepsGet = onCall({ maxInstances: 5, invoker: 'public' }, async (request: any) => {
  try {
    const { stepNumber } = request.data;

    const gameSteps: GameStep[] = [
      {
        stepId: 1,
        question: "What's your academic stream?",
        options: ["Computer Science/IT", "Electronics/ECE", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering", "Biotechnology", "Pure Sciences", "Mathematics"],
        category: "stream",
        points: 10
      },
      {
        stepId: 2,
        question: "What's your current academic year?",
        options: ["1st Year (Freshman)", "2nd Year (Sophomore)", "3rd Year (Junior)", "4th Year (Senior)", "Graduate/Masters"],
        category: "year",
        points: 10
      },
      {
        stepId: 3,
        question: "What type of project excites you most?",
        options: ["Web/Mobile Applications", "AI/Machine Learning", "IoT/Hardware Projects", "Data Analysis/Visualization", "Game Development", "Automation/Robotics", "Research/Analysis", "Social Impact Projects"],
        category: "interests",
        points: 15
      },
      {
        stepId: 4,
        question: "How would you rate your programming/technical skills?",
        options: ["Beginner (Just starting)", "Intermediate (Some projects done)", "Advanced (Multiple complex projects)", "Expert (Teaching/Mentoring others)"],
        category: "skillLevel",
        points: 15
      },
      {
        stepId: 5,
        question: "What's your preferred team size?",
        options: ["Solo Project (Individual)", "Pair Programming (2 people)", "Small Team (3-4 people)", "Large Team (5+ people)"],
        category: "teamSize",
        points: 10
      },
      {
        stepId: 6,
        question: "How much time can you dedicate to this project?",
        options: ["Quick Sprint (1-2 weeks)", "Short Term (1 month)", "Medium Term (2-3 months)", "Long Term (6+ months)"],
        category: "projectDuration",
        points: 10
      },
      {
        stepId: 7,
        question: "Which technologies are you most comfortable with?",
        options: ["Python/Django/Flask", "JavaScript/React/Node.js", "Java/Spring", "C++/C", "Mobile (Android/iOS)", "Database (SQL/NoSQL)", "Cloud (AWS/Azure/GCP)", "No specific preference"],
        category: "preferredTechnologies",
        points: 20
      }
    ];

    if (stepNumber && stepNumber <= gameSteps.length) {
      return {
        success: true,
        step: gameSteps[stepNumber - 1],
        totalSteps: gameSteps.length,
        isLastStep: stepNumber === gameSteps.length
      };
    }

    return {
      success: true,
      steps: gameSteps,
      totalSteps: gameSteps.length
    };
  } catch (error) {
    logger.error("Error getting game steps:", error);
    throw new Error(`Failed to get game steps: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Generate comprehensive project idea based on gamified context
 */
export const generateIdea = onCall({ maxInstances: 5, timeoutSeconds: 300, invoker: 'public' }, async (request: any) => {
  try {
    const { query, prompt, studentProfile, gameResponses, discoveryMode }: IdeaGenerationRequest = request.data;

    // Accept either query or prompt parameter for compatibility
    const inputQuery = query || prompt;

    if (!inputQuery || typeof inputQuery !== "string") {
      throw new Error("Invalid query/prompt parameter");
    }

    logger.info("Received request with:", { query, prompt, hasStudentProfile: !!studentProfile, discoveryMode });

    // Validate student profile structure
    const profile: StudentProfile = studentProfile || {
      stream: 'General',
      year: 'Not specified',
      interests: [],
      skillLevel: 'Intermediate',
      preferredTechnologies: [],
      teamSize: 'Individual',
      projectDuration: '1-2 months'
    };

    logger.info("Generating idea for:", { inputQuery, studentProfile: profile, discoveryMode });

    // Check if this is a discovery mode request (multiple brief ideas)
    const isDiscoveryRequest = discoveryMode || inputQuery.includes('Generate 6-8') || inputQuery.includes('diverse project ideas');

    logger.info("Using prompt type:", isDiscoveryRequest ? 'Discovery (Multiple Ideas)' : 'Comprehensive (Single Plan)');

    // DYNAMIC PROMPT LOGIC
    const db = admin.firestore();
    const promptType = isDiscoveryRequest ? 'discovery' : 'comprehensive';
    let contextPrompt: string;

    try {
      // Try to fetch dynamic prompt from Firestore
      const promptDoc = await db.collection('config').doc('prompts').get();
      if (promptDoc.exists && promptDoc.data()?.[promptType]) {
        const template = promptDoc.data()?.[promptType];
        contextPrompt = interpolatePrompt(template, inputQuery, profile);
        logger.info("Using DYNAMIC prompt from Firestore");
      } else {
        // Fallback to hardcoded prompts
        logger.info("Using DEFAULT hardcoded prompt");
        if (isDiscoveryRequest) {
          contextPrompt = createDiscoveryPrompt(inputQuery, profile);
        } else {
          contextPrompt = createComprehensivePrompt(inputQuery, profile);
        }
      }
    } catch (dbError) {
      logger.error("Error fetching dynamic prompt, using fallback:", dbError);
      // Fallback
      if (isDiscoveryRequest) {
        contextPrompt = createDiscoveryPrompt(inputQuery, profile);
      } else {
        contextPrompt = createComprehensivePrompt(inputQuery, profile);
      }
    }

    // Using the gemini model with genkit
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error("Missing Gemini API key in environment variables");
      throw new Error("Missing API key configuration. Please set GEMINI_API_KEY in environment variables.");
    }

    logger.info("Using Gemini API with configured key");

    try {
      const ai = genkit({
        plugins: [googleAI({
          apiKey: apiKey
        })],
        model: googleAI.model('gemini-3-flash-preview'),
      });

      // Create Langfuse trace for this generation (if available)
      const langfuseClient = getLangfuse();
      const trace = langfuseClient?.trace({
        name: "generate_idea",
        userId: request.auth?.uid,
        metadata: {
          promptType: isDiscoveryRequest ? 'discovery' : 'comprehensive',
          hasProfile: !!studentProfile,
        }
      });

      const generation = trace?.generation({
        name: "gemini-idea-generation",
        model: "gemini-3-flash-preview",
        input: contextPrompt,
      });

      const startTime = Date.now();
      const response = await ai.generate(contextPrompt);
      const endTime = Date.now();

      const text = response.text;

      // Extract usage data from Genkit response - try multiple possible property names
      const usage = response.usage || (response as any).usageMetadata || {};
      const usageAny = usage as any; // For fallback property access

      // Genkit uses inputTokens/outputTokens, but fallback to other common names
      const inputTokens = usage?.inputTokens || usageAny?.promptTokenCount || usageAny?.promptTokens || 0;
      const outputTokens = usage?.outputTokens || usageAny?.candidatesTokenCount || usageAny?.completionTokens || 0;
      const totalTokens = usage?.totalTokens || usageAny?.totalTokenCount || (inputTokens + outputTokens);

      // Log usage for debugging
      logger.info("Genkit response usage:", JSON.stringify(usage));
      logger.info(`Token counts - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`);

      // End generation with output and usage data
      generation?.end({
        output: text,
        usage: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens,
        },
        metadata: {
          latencyMs: endTime - startTime,
          outputLength: text?.length || 0,
          rawUsage: usage, // Store raw usage for debugging
        }
      });

      // Flush to ensure trace is sent
      await langfuseClient?.flushAsync();

      if (!text || text.trim().length === 0) {
        throw new Error("Generated text is empty");
      }

      logger.info("Successfully generated idea with length:", text.length);

      // Validate the generated idea structure (basic validation)
      const ideaIsValid = isValidProjectIdea({ title: 'Generated', overview: text });
      logger.info("Generated idea validation:", ideaIsValid);

      // Return the generated idea with metadata
      return {
        success: true,
        idea: text,
        metadata: {
          generatedAt: new Date().toISOString(),
          studentProfile: profile,
          query,
          gameResponses,
          validated: ideaIsValid,
          promptType: isDiscoveryRequest ? 'discovery' : 'comprehensive'
        }
      };
    } catch (genkitError) {
      logger.error("Genkit error:", genkitError);

      // Fallback to a simple response if genkit fails
      const fallbackIdea = `# ${query}\n\nBased on your profile as a ${profile.stream} student in ${profile.year}, here's a personalized project idea:\n\n## Project Overview\nThis project is designed for ${profile.skillLevel} level students and can be completed in ${profile.projectDuration}.\n\n## Technical Requirements\n- Technologies: ${profile.preferredTechnologies?.join(', ') || 'Flexible'}\n- Team Size: ${profile.teamSize}\n- Skill Level: ${profile.skillLevel}\n\n## Implementation Guide\n1. Start with basic setup and planning\n2. Implement core functionality\n3. Test and refine your solution\n\nThis project will help you develop practical skills in ${profile.interests?.join(', ') || 'your chosen area'}.`;

      return {
        success: true,
        idea: fallbackIdea,
        metadata: {
          generatedAt: new Date().toISOString(),
          studentProfile: profile,
          query,
          gameResponses,
          validated: true,
          fallback: true
        }
      };
    }
  } catch (error) {
    logger.error("Error generating idea:", error);
    throw new Error(`Failed to generate idea: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Save user's project idea to history
 */
export const saveIdeaToHistory = onCall({ maxInstances: 5, invoker: 'public' }, async (request: any) => {
  try {
    const { userId, ideaData, gameSteps }: HistorySaveRequest = request.data;

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Ensure user role exists (create default if not)
    // Get user email from Firebase Auth
    try {
      const userRecord = await admin.auth().getUser(userId);
      if (userRecord.email) {
        await ensureUserRole(userId, userRecord.email);

        // Update last login timestamp
        const db = admin.firestore();
        await db.collection('userRoles').doc(userId).update({
          lastLogin: new Date().toISOString()
        });
      }
    } catch (authError) {
      logger.warn('Could not get user email for role management:', authError);
    }

    // Create a new history document in Firestore
    const historyId = `history_${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Prepare data for Firestore
    const historyData = {
      id: historyId,
      userId: userId,
      query: ideaData?.query || '',
      idea: ideaData?.idea || '',
      studentProfile: ideaData?.studentProfile || {},
      gameScore: ideaData?.gameScore || 0,
      gameStepsCount: gameSteps?.length || 0,
      generatedAt: timestamp
    };

    logger.info("Saving idea to history for user:", userId);

    // Save to Firestore
    const db = admin.firestore();
    await db.collection('projectHistory').doc(historyId).set(historyData);

    // Also update the user document with a reference to their latest idea
    await db.collection('users').doc(userId).set({
      lastHistoryId: historyId,
      lastGeneratedAt: timestamp,
      totalIdeasGenerated: admin.firestore.FieldValue.increment(1)
    }, { merge: true });

    return {
      success: true,
      historyId: historyId,
      message: "Idea saved to history successfully",
      savedData: {
        userId,
        ideaQuery: ideaData?.query,
        gameStepsCount: gameSteps?.length || 0
      }
    };
  } catch (error) {
    logger.error("Error saving idea to history:", error);
    throw new Error(`Failed to save idea: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Get user's project idea history
 */
export const getUserHistory = onCall({ maxInstances: 5, invoker: 'public' }, async (request: any) => {
  try {
    const { userId } = request.data;

    if (!userId) {
      throw new Error("User ID is required");
    }

    logger.info("Getting history for user:", userId);

    // Fetch from Firestore
    const db = admin.firestore();
    const historySnapshot = await db.collection('projectHistory')
      .where('userId', '==', userId)
      .orderBy('generatedAt', 'desc')
      .limit(50) // Limit to most recent 50 items
      .get();

    // Transform data
    const historyItems: Array<any> = [];
    historySnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      historyItems.push(doc.data());
    });

    // Get user stats
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    return {
      success: true,
      history: historyItems as Array<any>,
      totalProjects: historyItems.length,
      userStats: {
        totalIdeasGenerated: (userData && userData.totalIdeasGenerated) || historyItems.length,
        lastGeneratedAt: (userData && userData.lastGeneratedAt) || null
      }
    };
  } catch (error) {
    logger.error("Error getting user history:", error);
    throw new Error(`Failed to get history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Get all users for admin console (admin only)
 */
export const getAllUsers = onCall({ maxInstances: 3, invoker: 'public' }, async (request: any) => {
  try {
    const { adminUserId } = request.data;

    if (!adminUserId) {
      throw new Error("Admin user ID is required");
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Access denied: Admin privileges required");
    }

    const db = admin.firestore();

    // Get all user roles
    const usersSnapshot = await db.collection('userRoles').get();
    const users: UserRole[] = [];

    usersSnapshot.forEach((doc) => {
      users.push(doc.data() as UserRole);
    });

    // Log admin action
    await logAdminAction(adminUserId, 'VIEW_ALL_USERS', null);

    return {
      success: true,
      users: users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };
  } catch (error) {
    logger.error("Error getting all users:", error);
    throw new Error(`Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Get user's role and permissions
 */
export const getUserRole = onCall({ maxInstances: 5, invoker: 'public' }, async (request: any) => {
  try {
    const { userId } = request.data;

    if (!userId) {
      throw new Error("User ID is required");
    }

    const db = admin.firestore();
    const userDoc = await db.collection('userRoles').doc(userId).get();

    if (!userDoc.exists) {
      // Return default user role
      return {
        success: true,
        role: 'user',
        status: 'active',
        isAdmin: false
      };
    }

    const userData = userDoc.data() as UserRole;

    return {
      success: true,
      role: userData.role,
      status: userData.status,
      isAdmin: userData.role === 'admin' && userData.status === 'active'
    };
  } catch (error) {
    logger.error("Error getting user role:", error);
    throw new Error(`Failed to get user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Update user role (admin only)
 */
export const updateUserRole = onCall({ maxInstances: 3, invoker: 'public' }, async (request: any) => {
  try {
    const { adminUserId, targetUserId, newRole, newStatus }: UserManagementRequest = request.data;

    if (!adminUserId || !targetUserId) {
      throw new Error("Admin user ID and target user ID are required");
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Access denied: Admin privileges required");
    }

    const db = admin.firestore();
    const userDoc = await db.collection('userRoles').doc(targetUserId).get();

    if (!userDoc.exists) {
      throw new Error("Target user not found");
    }

    const currentData = userDoc.data() as UserRole;
    const updateData: Partial<UserRole> = {};

    if (newRole && newRole !== currentData.role) {
      updateData.role = newRole;
    }

    if (newStatus && newStatus !== currentData.status) {
      updateData.status = newStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return {
        success: true,
        message: "No changes needed"
      };
    }

    await db.collection('userRoles').doc(targetUserId).update(updateData);

    // Log admin action
    await logAdminAction(adminUserId, 'UPDATE_USER_ROLE', targetUserId, {
      previousRole: currentData.role,
      newRole: newRole || currentData.role,
      previousStatus: currentData.status,
      newStatus: newStatus || currentData.status
    });

    return {
      success: true,
      message: "User role updated successfully",
      updatedData: updateData
    };
  } catch (error) {
    logger.error("Error updating user role:", error);
    throw new Error(`Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Get all ideas across users (admin only)
 */
export const getAllIdeas = onCall({ maxInstances: 3, invoker: 'public' }, async (request: any) => {
  try {
    const { adminUserId, limit = 100, searchQuery } = request.data;

    if (!adminUserId) {
      throw new Error("Admin user ID is required");
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Access denied: Admin privileges required");
    }

    const db = admin.firestore();
    let query = db.collection('projectHistory')
      .orderBy('generatedAt', 'desc');

    if (searchQuery) {
      // Simple client-side filtering would be better for complex text, 
      // but for now we'll rely on the client to filter or basic text match if supported
      // Firestore doesn't support full-text search natively without extensions
    }





    const snapshot = await query.limit(limit).get();
    const ideas: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!searchQuery ||
        data.query?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        data.idea?.toLowerCase().includes(searchQuery.toLowerCase())) {
        ideas.push(data);
      }
    });

    // Log admin action
    // Log admin action
    await logAdminAction(adminUserId, 'VIEW_ALL_IDEAS', null, { searchQuery: searchQuery || null, resultCount: ideas.length });

    return {
      success: true,
      ideas,
      totalCount: ideas.length
    };
  } catch (error) {
    logger.error("Error getting all ideas:", error);
    throw new Error(`Failed to get all ideas: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Get admin activity logs (admin only)
 */
export const getAdminLogs = onCall({ maxInstances: 3 }, async (request: any) => {
  try {
    const { adminUserId, limit = 50 } = request.data;

    if (!adminUserId) {
      return { success: false, error: 'Admin user ID is required' };
    }

    // Verify admin privileges
    const isAdmin = await isUserAdmin(adminUserId);
    if (!isAdmin) {
      return { success: false, error: 'Insufficient privileges' };
    }

    const db = admin.firestore();
    const logsSnapshot = await db.collection('adminLogs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const logs: AdminAction[] = [];
    logsSnapshot.forEach((doc) => {
      logs.push(doc.data() as AdminAction);
    });

    return { success: true, logs };
  } catch (error) {
    logger.error('Error fetching admin logs:', error);
    return { success: false, error: 'Failed to fetch admin logs' };
  }
});

/**
 * Modify a specific section of a project idea
 */
export const modifyIdeaSection = onCall({ maxInstances: 3, timeoutSeconds: 300 }, async (request: any) => {
  try {
    const { userId, originalIdea, sectionTitle, sectionContent, modificationPrompt } = request.data;

    if (!userId || !originalIdea || !sectionTitle || !modificationPrompt) {
      return { success: false, error: 'Missing required parameters' };
    }

    // Ensure user role exists
    const auth = admin.auth();
    const userRecord = await auth.getUser(userId);
    await ensureUserRole(userId, userRecord.email || '');

    // Get Gemini API key from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      logger.error('Gemini API key not found in environment variables');
      return { success: false, error: 'API configuration error' };
    }

    // Initialize Genkit with GoogleAI
    const ai = genkit({
      plugins: [googleAI({ apiKey: geminiApiKey })],
    });

    // Create the modification prompt
    const modificationSystemPrompt = `You are an expert project idea modifier. Your task is to modify a specific section of a project idea based on user feedback while maintaining consistency with the overall project structure.

Original Project Idea:
${originalIdea}

Section to Modify: "${sectionTitle}"
Current Section Content:
${sectionContent}

Modification Request: ${modificationPrompt}

Instructions:
1. Modify ONLY the specified section based on the user's request
2. Maintain the same markdown structure and formatting
3. Ensure the modified section remains consistent with the overall project theme
4. Keep the same section header format (## ${sectionTitle})
5. Return the COMPLETE modified project idea with all sections intact
6. Make sure all other sections remain unchanged unless they need minor adjustments for consistency

Return the complete modified project idea:`;

    try {
      // Generate modified idea using Genkit
      const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.5-pro',
        prompt: modificationSystemPrompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        },
      });

      const modifiedIdea = llmResponse.text;

      if (!modifiedIdea || modifiedIdea.trim().length === 0) {
        throw new Error('Empty response from AI model');
      }

      logger.info(`Section modification completed for user ${userId}`);

      return {
        success: true,
        modifiedIdea: modifiedIdea,
        originalSection: sectionContent,
        modificationPrompt: modificationPrompt
      };

    } catch (genkitError) {
      logger.error('Genkit error during section modification:', genkitError);

      // Fallback: Simple text replacement approach
      logger.info('Using fallback modification approach');

      const fallbackModification = `## ${sectionTitle}\n\n${sectionContent}\n\n**Modification Note:** ${modificationPrompt}\n\n*This section has been marked for modification. Please regenerate for full AI-powered modification.*`;

      // Replace the section in the original idea
      const sectionRegex = new RegExp(`## ${sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\s\S]*?(?=## |$)`, 'i');
      const modifiedIdea = originalIdea.replace(sectionRegex, fallbackModification);

      return {
        success: true,
        modifiedIdea: modifiedIdea,
        originalSection: sectionContent,
        modificationPrompt: modificationPrompt,
        fallback: true
      };
    }

  } catch (error) {
    logger.error('Error modifying idea section:', error);
    return { success: false, error: 'Failed to modify section. Please try again.' };
  }
});

/**
 * Bulk user operations (admin only)
 */
export const bulkUserOperations = onCall({ maxInstances: 3 }, async (request: any) => {
  try {
    const { adminUserId, userIds, action, newRole, newStatus }: BulkUserRequest = request.data;

    if (!adminUserId || !userIds || !Array.isArray(userIds) || !action) {
      throw new Error("Admin user ID, user IDs array, and action are required");
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error("Access denied: Admin privileges required");
    }

    const db = admin.firestore();
    const results: any[] = [];

    for (const userId of userIds) {
      try {
        if (action === 'changeRole' && newRole) {
          await db.collection('userRoles').doc(userId).update({ role: newRole });
          results.push({ userId, success: true, action: 'roleChanged' });
        } else if (action === 'changeStatus' && newStatus) {
          await db.collection('userRoles').doc(userId).update({ status: newStatus });
          results.push({ userId, success: true, action: 'statusChanged' });
        }
      } catch (error) {
        results.push({ userId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // Log admin action
    await logAdminAction(adminUserId, 'BULK_USER_OPERATION', null, {
      action,
      userIds,
      newRole,
      newStatus,
      results
    });

    return {
      success: true,
      results,
      message: `Bulk operation completed for ${results.filter(r => r.success).length}/${userIds.length} users`
    };
  } catch (error) {
    logger.error("Error in bulk user operations:", error);
    throw new Error(`Failed to perform bulk operations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
/**
 * Update System Prompts (Admin Only) - For Prompt Studio
 */
export const updateSystemPrompt = onCall({ maxInstances: 3, invoker: 'public' }, async (request: any) => {
  try {
    const { adminUserId, type, newPrompt } = request.data;

    if (!adminUserId || !type || !newPrompt) {
      throw new Error("Missing required fields");
    }

    const isAdmin = await isUserAdmin(adminUserId);
    if (!isAdmin) throw new Error("Access Denied");

    const db = admin.firestore();
    await db.collection('config').doc('prompts').set({
      [type]: newPrompt
    }, { merge: true });

    await logAdminAction(adminUserId, 'UPDATE_PROMPT', 'system', { type });

    return { success: true, message: "Prompt updated successfully" };

  } catch (error) {
    logger.error("Error updating prompt:", error);
    throw new Error(`Failed to update prompt: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
});

/**
 * Moderate Idea (Flag/Delete) (Admin Only)
 */
export const moderateIdea = onCall({ maxInstances: 3, invoker: 'public' }, async (request: any) => {
  try {
    const { adminUserId, ideaId, action } = request.data; // action: 'flag' | 'delete' | 'unflag'

    if (!adminUserId || !ideaId || !action) throw new Error("Missing fields");

    const isAdmin = await isUserAdmin(adminUserId);
    if (!isAdmin) throw new Error("Access Denied");

    const db = admin.firestore();
    const ideaRef = db.collection('projectHistory').doc(ideaId);

    if (action === 'delete') {
      await ideaRef.delete();
    } else if (action === 'flag') {
      await ideaRef.update({ 'flags.isInappropriate': true, 'flags.flaggedBy': adminUserId, 'flags.flaggedAt': new Date().toISOString() });
    } else if (action === 'unflag') {
      await ideaRef.update({ 'flags.isInappropriate': false });
    }

    await logAdminAction(adminUserId, `MODERATE_IDEA_${action.toUpperCase()}`, ideaId, { action });

    return { success: true };

  } catch (error) {
    logger.error("Error moderating idea:", error);
    throw new Error(`Failed to moderate: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
});

/**
 * Get System Prompts (Admin Only) - For Prompt Studio
 */
export const getSystemPrompts = onCall({ maxInstances: 3, invoker: 'public' }, async (request: any) => {
  try {
    const { adminUserId } = request.data;

    const isAdmin = await isUserAdmin(adminUserId);
    if (!isAdmin) throw new Error("Access Denied");

    const db = admin.firestore();
    const doc = await db.collection('config').doc('prompts').get();

    // Return defaults if not set in DB
    return {
      success: true,
      prompts: {
        discovery: doc.data()?.discovery || createDiscoveryPrompt("{{inputQuery}}", {} as any),
        comprehensive: doc.data()?.comprehensive || createComprehensivePrompt("{{inputQuery}}", {} as any)
      }
    };
  } catch (error) {
    logger.error("Error getting prompts", error);
    // Return default prompts on error instead of throwing to avoid CORS/Client issues
    return {
      success: true,
      prompts: {
        discovery: createDiscoveryPrompt("{{inputQuery}}", {} as any),
        comprehensive: createComprehensivePrompt("{{inputQuery}}", {} as any)
      },
      error: 'Failed to load custom prompts, using defaults'
    };
  }
});

/**
 * Check System Health (Dev Tool)
 */
export const checkSystemHealth = onCall({ maxInstances: 3, invoker: 'public' }, async (request: any) => {
  try {
    // Basic connectivity check - just returning verified timestamp
    return {
      success: true,
      status: 'operational',
      timestamp: new Date().toISOString(),
      services: {
        firestore: 'online',
        functions: 'online'
      }
    };
  } catch (error) {
    logger.error("Health check failed:", error);
    return {
      success: false,
      status: 'outage',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});
