from django.db import models
from django.contrib.postgres.fields import ArrayField
import json


class SimulationRun(models.Model):
    """Store simulation run metadata and configuration"""
    id = models.AutoField(primary_key=True)
    trigger_event = models.TextField()
    num_agents = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('running', 'Running'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='running'
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Simulation {self.id} - {self.trigger_event[:50]}"


class AgentState(models.Model):
    """Store agent states at different simulation stages"""
    simulation = models.ForeignKey(SimulationRun, on_delete=models.CASCADE, related_name='agent_states')
    agent_id = models.CharField(max_length=100)
    stage = models.CharField(
        max_length=20,
        choices=[
            ('initial', 'Initial'),
            ('post_trigger', 'Post Trigger'),
            ('final', 'Final')
        ]
    )
    
    # Agent properties
    archetype = models.CharField(max_length=100, null=True, blank=True)
    sentiment = models.FloatField(null=True, blank=True)
    opinion = models.TextField(null=True, blank=True)
    
    # Store full agent data as JSON for flexibility
    data = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['simulation', 'stage', 'agent_id']
        unique_together = ['simulation', 'agent_id', 'stage']
    
    def __str__(self):
        return f"{self.agent_id} - {self.stage} (Sim {self.simulation_id})"


class NetworkSnapshot(models.Model):
    """Store network adjacency matrix snapshots"""
    simulation = models.ForeignKey(SimulationRun, on_delete=models.CASCADE, related_name='network_snapshots')
    stage = models.CharField(
        max_length=20,
        choices=[
            ('initial', 'Initial'),
            ('final', 'Final')
        ]
    )
    
    # Store adjacency matrix as JSON
    adjacency_matrix = models.JSONField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['simulation', 'stage']
        unique_together = ['simulation', 'stage']
    
    def __str__(self):
        return f"Network {self.stage} (Sim {self.simulation_id})"


class SimulationSummary(models.Model):
    """Store supervisor summary and analysis"""
    simulation = models.OneToOneField(SimulationRun, on_delete=models.CASCADE, related_name='summary')
    summary_text = models.TextField()
    
    # Optional: store extracted metrics
    metrics = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Summary for Simulation {self.simulation_id}"

