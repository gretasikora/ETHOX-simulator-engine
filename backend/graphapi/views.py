from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .services import load_graph, get_metadata, get_node_detail, clear_cache


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
