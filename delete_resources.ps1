# Delete all specified functions and disable hosting

$functionsToDelete = @(
    "gameStepsGet",
    "generateIdea",
    "saveIdeaToHistory",
    "getUserHistory",
    "getAllUsers",
    "getUserRole",
    "updateUserRole",
    "getAllIdeas",
    "getAdminLogs",
    "modifyIdeaSection",
    "bulkUserOperations",
    "updateSystemPrompt",
    "moderateIdea",
    "getSystemPrompts",
    "checkSystemHealth",
    "generate_detailed_report",
    "updateProjectHistory",
    "getDetailedAnalytics",
    "checkDailyProgress",
    "updateQuestProgress",
    "generate_codebase"
)

Write-Host "Preparing to delete the following functions:"
$functionsToDelete | ForEach-Object { Write-Host " - $_" }

Write-Host "`nDisabling Firebase Hosting..."
firebase hosting:disable --force

Write-Host "`nDeleting Cloud Functions..."
# Join functions with spaces to pass as arguments
$functionsArgs = $functionsToDelete -join " "

# Execute firebase functions:delete with all function names and --force
# Note: This deletes them in parallel/batch where supported by CLI
Invoke-Expression "firebase functions:delete $functionsArgs --force"

Write-Host "`nCleanup operations completed."
