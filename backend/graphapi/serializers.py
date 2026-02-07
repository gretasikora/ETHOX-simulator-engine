from rest_framework import serializers


class NodeSerializer(serializers.Serializer):
    agent_id = serializers.CharField()
    degree = serializers.IntegerField(required=False)
    cluster = serializers.IntegerField(required=False)
    traits = serializers.DictField(child=serializers.FloatField(), required=False)
    degree_centrality = serializers.FloatField(required=False)
    betweenness_centrality = serializers.FloatField(required=False)


class EdgeSerializer(serializers.Serializer):
    source = serializers.CharField()
    target = serializers.CharField()
    weight = serializers.FloatField(required=False, default=1.0)
