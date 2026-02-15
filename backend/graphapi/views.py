import sys
import uuid
from pathlib import Path

# Ensure project root for simulation imports
ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .services import load_graph, get_metadata, get_node_detail, clear_cache
from .simulation_service import run_simulation
from .simulation_store import store_simulation, get_agents


class GraphView(APIView):
    def get(self, request):
        graph = load_graph()
        meta = get_metadata(graph)
        return Response({
            "nodes": graph["nodes"],
            "edges": graph["edges"],
            "metadata": meta,
        })


class NodeDetailView(APIView):
    def get(self, request, agent_id):
        graph = load_graph()
        detail = get_node_detail(graph, agent_id)
        if detail is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(detail)


class GraphUploadView(APIView):
    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"detail": "No file provided. Use form key 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            content = file_obj.read().decode("utf-8")
            data = __import__("json").loads(content)
        except (UnicodeDecodeError, ValueError) as e:
            return Response(
                {"detail": f"Invalid JSON: {e!s}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if "nodes" not in data or not isinstance(data.get("nodes"), list):
            return Response(
                {"detail": "JSON must have 'nodes' array."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if "edges" not in data or not isinstance(data.get("edges"), list):
            return Response(
                {"detail": "JSON must have 'edges' array."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.conf import settings
        path = settings.DATA_DIR / "network.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            __import__("json").dump(data, f, indent=2)

        clear_cache()
        graph = load_graph()
        meta = get_metadata(graph)
        return Response({
            "detail": "Graph uploaded successfully.",
            "metadata": meta,
        })


class RunSimulationView(APIView):
    def post(self, request):
        data = request.data
        if not isinstance(data, dict):
            return Response(
                {"detail": "Request body must be JSON object."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        trigger = data.get("trigger")
        num_agents = data.get("num_agents")

        # Validate trigger
        if trigger is None:
            return Response(
                {"detail": "Missing 'trigger' field."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(trigger, str):
            return Response(
                {"detail": "'trigger' must be a string."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not trigger.strip():
            return Response(
                {"detail": "'trigger' must be non-empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate num_agents
        if num_agents is None:
            return Response(
                {"detail": "Missing 'num_agents' field."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            num_agents = int(num_agents)
        except (TypeError, ValueError):
            return Response(
                {"detail": "'num_agents' must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if num_agents < 1:
            return Response(
                {"detail": "'num_agents' must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            initial_graph, post_trigger_graph, final_graph = run_simulation(trigger.strip(), num_agents)
        except Exception as e:
            return Response(
                {"detail": f"Simulation failed: {e!s}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Save to database (and file backup)
        try:
            from .simulation_storage import save_simulation
            db_simulation = save_simulation(
                trigger_event=trigger.strip(),
                num_agents=num_agents,
                initial_graph=initial_graph,
                post_trigger_graph=post_trigger_graph,
                final_graph=final_graph,
                summary_text=""  # Will be filled when report is generated
            )
            simulation_id = str(db_simulation.id)
        except Exception as e:
            print(f"Warning: Failed to save to database: {e}")
            # Fallback to UUID if database save fails
            simulation_id = str(uuid.uuid4())

        return Response({
            "simulation_id": simulation_id,
            "initial_graph": initial_graph,
            "post_trigger_graph": post_trigger_graph,
            "final_graph": final_graph,
        })


class SimulationReportView(APIView):
    def post(self, request):
        data = request.data
        if not isinstance(data, dict):
            return Response(
                {"detail": "Request body must be JSON object."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        simulation_id = data.get("simulation_id")
        trigger = data.get("trigger", "")
        include_initial = bool(data.get("include_initial", False))

        if not simulation_id or not isinstance(simulation_id, str):
            return Response(
                {"detail": "Missing or invalid 'simulation_id'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = get_agents(simulation_id)
        if result is None:
            return Response(
                {"detail": "Simulation not found or expired."},
                status=status.HTTP_404_NOT_FOUND,
            )

        agents, stored_trigger = result
        event_message = trigger.strip() or stored_trigger

        if not agents:
            return Response(
                {"detail": "No agent data available for report."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Compute metrics from final agent outputs
        avg_care = sum(a.care for a in agents) / len(agents)
        avg_usage = sum(a.change_in_support for a in agents) / len(agents)
        care_score_100 = max(0, min(100, round(avg_care * 10)))
        change_in_support_50 = max(-50, min(50, round(avg_usage * 10)))

        try:
            from simulation.interaction import supervisor_summarize
            report_text = supervisor_summarize(agents, event_message, include_initial=include_initial)
        except Exception as e:
            return Response(
                {"detail": f"Report generation failed: {e!s}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({
            "simulation_id": simulation_id,
            "care_score_100": care_score_100,
            "change_in_support_50": change_in_support_50,
            "report_text": report_text,
        })
