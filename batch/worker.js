// Just for testing

async function main() {
    const { AI_RESULT_ID: aiResultId, FILE_KEY: fileKey } = process.env;

    console.log("=== Batch job started ===");
    console.log("AI_RESULT_ID:", aiResultId);
    console.log("FILE_KEY:", fileKey);

    if (!aiResultId || !fileKey) {
        console.error("Missing AI_RESULT_ID or FILE_KEY env var — check containerOverrides in the submitting Lambda");
        process.exit(1);
    }

    console.log("=== Batch job finished (placeholder — no real processing yet) ===");
    process.exit(0);
}




main();