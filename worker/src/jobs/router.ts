import { runCurriculumFactory, type CurriculumJobPayload } from "./curriculum-factory";
import { runSocialBatch, type SocialBatchPayload } from "./social-batch";
import { runYoutubeTranscript, type YoutubeTranscriptPayload } from "./youtube-transcript";
import { runCourseSlideImages, type CourseSlideImagesPayload } from "./course-slide-images";
import { runGenerateSegmentAudio, type GenerateSegmentAudioPayload } from "./generate-segment-audio";
import { runGenerateSegmentVideo, type GenerateSegmentVideoPayload } from "./generate-segment-video";
import { runLessonVideoPipeline, type LessonVideoPipelinePayload } from "./lesson-video-pipeline";
import { runTrainCharacterLora, type TrainCharacterLoraPayload } from "./train-character-lora";
import { runGenerateCharacterScenes, type GenerateCharacterScenesPayload } from "./generate-character-scenes";
import { runGenerateBundleAnchor, type GenerateBundleAnchorPayload } from "./generate-bundle-anchor";
import { runFolioDailyBuild } from "./folio-daily-build";
import { runNewsletterDraft, type NewsletterDraftPayload } from "./newsletter-draft";
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

    case "generate_segment_audio":
      await runGenerateSegmentAudio(jobId, payload as unknown as GenerateSegmentAudioPayload);
      break;

    case "generate_segment_video":
      await runGenerateSegmentVideo(jobId, payload as unknown as GenerateSegmentVideoPayload);
      break;

    case "lesson_video_pipeline":
      await runLessonVideoPipeline(jobId, payload as unknown as LessonVideoPipelinePayload);
      break;

    case "train_character_lora":
      await runTrainCharacterLora(jobId, payload as unknown as TrainCharacterLoraPayload);
      break;

    case "generate_character_scenes":
      await runGenerateCharacterScenes(jobId, payload as unknown as GenerateCharacterScenesPayload);
      break;

    case "generate_bundle_anchor":
      await runGenerateBundleAnchor(jobId, payload as unknown as GenerateBundleAnchorPayload);
      break;

    case "folio_daily_build":
      await runFolioDailyBuild(jobId, payload);
      break;

    case "newsletter_draft":
      await runNewsletterDraft(jobId, payload as unknown as NewsletterDraftPayload);
      break;

    case "youtube_batch_playlist":
      // Gated on YouTube OAuth token — implement in Phase 1.5
      await updateProgress(jobId, 0, "YouTube OAuth not yet configured", "failed", undefined, "Requires YOUTUBE_OAUTH_TOKEN — deferred to Phase 1.5");
      break;

    default:
      await updateProgress(jobId, 0, `Unknown job type: ${type}`, "failed", undefined, `Unknown type: ${type}`);
  }
}
