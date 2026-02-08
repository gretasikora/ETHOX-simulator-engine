import uuid

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .services import load_graph, get_metadata, get_node_detail, clear_cache
from .simulation_service import run_simulation


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
        if num_agents < 10 or num_agents > 5000:
            return Response(
                {"detail": "'num_agents' must be between 10 and 5000."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            initial_graph, final_graph = run_simulation(trigger.strip(), num_agents)
        except Exception as e:
            return Response(
                {"detail": f"Simulation failed: {e!s}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        simulation_id = str(uuid.uuid4())
        return Response({
            "simulation_id": simulation_id,
            "initial_graph": initial_graph,
            "final_graph": final_graph,
        })
