import { runCurriculumFactory, type CurriculumJobPayload } from "./curriculum-factory";
import { runSocialBatch, type SocialBatchPayload } from "./social-batch";
import { runYoutubeTranscript, type YoutubeTranscriptPayload } from "./youtube-transcript";
import { runCourseSlideImages, type CourseSlideImagesPayload } from "./course-slide-images";
import { updateProgress } from "../lib/progress";

export async function processJob(
  jobId: string,
  type: string,
  payload: Record<string, unknown>
) {
  console.log(`[router] Processing job ${jobId} — type: ${type}`);

  // Mark as running immediately
  await updateProgress(jobId, 1, "Worker picked up job — starting...", "running");

  switch (type) {
    case "curriculum_factory":
      await runCurriculumFactory(jobId, payload as unknown as CurriculumJobPayload);
      break;

    case "research_batch":
      // Phase 2 extension — not yet implemented
      await updateProgress(jobId, 0, "research_batch not yet implemented", "failed", undefined, "Not implemented");
      break;

    case "council_session":
      // Phase 4 — CrewAI multi-agent Council Chamber
      // Architecture is ready; implementation comes in Phase 4
      await updateProgress(jobId, 0, "council_session requires Phase 4 Council Worker", "failed", undefined, "Phase 4 not yet deployed");
      break;

    case "social_batch":
      await runSocialBatch(jobId, payload as unknown as SocialBatchPayload);
      break;

    case "youtube_transcript":
      await runYoutubeTranscript(jobId, payload as unknown as YoutubeTranscriptPayload);
      break;

    case "course_slide_images":
      await runCourseSlideImages(jobId, payload as unknown as CourseSlideImagesPayload);
      break;

    default:
      await updateProgress(jobId, 0, `Unknown job type: ${type}`, "failed", undefined, `Unknown type: ${type}`);
  }
}
