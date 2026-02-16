# Generated migration for graphapi models

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='SimulationRun',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('trigger_event', models.TextField()),
                ('num_agents', models.IntegerField()),
                ('status', models.CharField(choices=[('running', 'Running'), ('completed', 'Completed'), ('failed', 'Failed')], default='running', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'db_table': 'graphapi_simulationrun',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SimulationSummary',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('summary_text', models.TextField()),
                ('metrics', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('simulation', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='summary', to='graphapi.simulationrun')),
            ],
            options={
                'db_table': 'graphapi_simulationsummary',
            },
        ),
        migrations.CreateModel(
            name='NetworkSnapshot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('stage', models.CharField(choices=[('initial', 'Initial'), ('post_trigger', 'Post Trigger'), ('final', 'Final')], max_length=20)),
                ('adjacency_matrix', models.JSONField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('simulation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='network_snapshots', to='graphapi.simulationrun')),
            ],
            options={
                'db_table': 'graphapi_networksnapshot',
                'ordering': ['created_at'],
            },
        ),
        migrations.CreateModel(
            name='AgentState',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('agent_id', models.CharField(max_length=50)),
                ('stage', models.CharField(choices=[('initial', 'Initial'), ('post_trigger', 'Post Trigger'), ('final', 'Final')], max_length=20)),
                ('archetype', models.CharField(blank=True, max_length=100, null=True)),
                ('sentiment', models.FloatField(blank=True, null=True)),
                ('opinion', models.TextField(blank=True)),
                ('data', models.JSONField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('simulation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='agent_states', to='graphapi.simulationrun')),
            ],
            options={
                'db_table': 'graphapi_agentstate',
                'ordering': ['simulation', 'agent_id', 'stage'],
                'indexes': [models.Index(fields=['simulation', 'agent_id'], name='graphapi_ag_simulat_idx'), models.Index(fields=['simulation', 'stage'], name='graphapi_ag_simulat_stage_idx')],
            },
        ),
    ]
