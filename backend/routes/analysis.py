import json
import logging
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from models.schemas import AnalyzeRequest, AnalysisReport
from services.analysis_service import AnalysisService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Analysis"])
analysis_service = AnalysisService()

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "AI Project Reviewer Backend",
        "version": "1.0.0",
    }

@router.post("/analyze", response_model=AnalysisReport)
async def analyze_project(payload: AnalyzeRequest):
    """
    Standard synchronous endpoint to analyze a live project URL.
    Returns the complete structured AnalysisReport JSON.
    """
    try:
        report = await analysis_service.run_full_analysis(payload.url)
        return report
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except RuntimeError as run_err:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(run_err),
        )
    except Exception as e:
        logger.error(f"Unexpected error analyzing {payload.url}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="We couldn't complete the full analysis at this moment. Please check the URL and try again.",
        )

@router.post("/analyze/stream")
async def analyze_project_stream(payload: AnalyzeRequest):
    """
    Server-Sent Events (SSE) streaming endpoint.
    Emits real-time conversational progress updates, followed by the final report data.
    """
    async def event_generator():
        queue = []

        async def callback(stage: str, msg: str):
            queue.append({"type": "progress", "stage": stage, "message": msg})

        # Start analysis task
        task = None
        try:
            report_coro = analysis_service.run_full_analysis(payload.url, progress_callback=callback)
            
            # Run coroutine while yielding progress updates
            import asyncio
            task = asyncio.create_task(report_coro)

            while not task.done():
                while queue:
                    item = queue.pop(0)
                    yield f"data: {json.dumps(item)}\n\n"
                await asyncio.sleep(0.2)

            # Flush remaining queue
            while queue:
                item = queue.pop(0)
                yield f"data: {json.dumps(item)}\n\n"

            # Check if task raised an error or completed
            report = await task
            report_dict = report.model_dump()
            final_payload = {"type": "complete", "report": report_dict}
            yield f"data: {json.dumps(final_payload)}\n\n"

        except ValueError as e:
            error_payload = {"type": "error", "message": str(e)}
            yield f"data: {json.dumps(error_payload)}\n\n"
        except Exception as e:
            logger.error(f"Stream analysis failed for {payload.url}: {e}", exc_info=True)
            error_payload = {
                "type": "error",
                "message": f"We encountered an issue reviewing this site: {str(e)[:120]}",
            }
            yield f"data: {json.dumps(error_payload)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
