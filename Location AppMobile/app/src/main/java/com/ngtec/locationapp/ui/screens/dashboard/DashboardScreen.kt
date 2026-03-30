package com.ngtec.locationapp.ui.screens.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    val metrics = listOf(
        DashboardMetric("Biens", uiState.totalBiens.toString()),
        DashboardMetric("Clients", uiState.totalClients.toString()),
        DashboardMetric("Contrats", uiState.totalContrats.toString()),
        DashboardMetric("Paiements", uiState.totalPaiements.toString()),
        DashboardMetric("Depenses", uiState.totalDepenses.toString()),
        DashboardMetric("Revenus mensuels", "${uiState.revenusMensuels} GNF"),
        DashboardMetric("Encaissements", "${uiState.encaissements} GNF"),
        DashboardMetric("Depenses totales", "${uiState.depenses} GNF"),
        DashboardMetric("Solde net", "${uiState.soldeNet} GNF")
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Dashboard",
                style = MaterialTheme.typography.headlineMedium
            )
        }

        item {
            Text(
                text = "Vue d'ensemble des donnees synchronisees localement.",
                style = MaterialTheme.typography.bodyMedium
            )
        }

        if (uiState.errorMessage != null) {
            item {
                Text(
                    text = uiState.errorMessage.orEmpty(),
                    color = MaterialTheme.colorScheme.error
                )
            }
        }

        item {
            Button(
                onClick = viewModel::refresh,
                enabled = !uiState.isRefreshing
            ) {
                Text(if (uiState.isRefreshing) "Synchronisation..." else "Actualiser")
            }
        }

        items(metrics) { metric ->
            DashboardMetricCard(metric = metric)
        }
    }
}

@Composable
private fun DashboardMetricCard(metric: DashboardMetric) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = metric.label,
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = metric.value,
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}

private data class DashboardMetric(
    val label: String,
    val value: String
)
