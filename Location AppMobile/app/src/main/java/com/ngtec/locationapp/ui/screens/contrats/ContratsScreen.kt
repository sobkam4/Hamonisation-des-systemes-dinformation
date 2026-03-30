package com.ngtec.locationapp.ui.screens.contrats

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ngtec.locationapp.domain.model.Contrat
import com.ngtec.locationapp.ui.common.UiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContratsScreen(
    onAddContrat: () -> Unit,
    viewModel: ContratsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Contrats") })
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onAddContrat) {
                Icon(Icons.Default.Add, contentDescription = "Ajouter un contrat")
            }
        }
    ) { paddingValues ->
        when (val state = uiState) {
            UiState.Idle, UiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Chargement des contrats...")
                }
            }

            is UiState.Error -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = state.message,
                        color = MaterialTheme.colorScheme.error
                    )
                    Button(onClick = viewModel::refresh) {
                        Text("Reessayer")
                    }
                }
            }

            is UiState.Success -> {
                if (state.data.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Aucun contrat disponible.")
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(items = state.data, key = { contrat -> contrat.id }) { contrat ->
                            ContratCard(
                                contrat = contrat,
                                onDelete = { viewModel.deleteContrat(contrat.id) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ContratCard(
    contrat: Contrat,
    onDelete: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Box(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = contrat.reference,
                    style = MaterialTheme.typography.titleMedium
                )
                IconButton(
                    onClick = onDelete,
                    modifier = Modifier.align(Alignment.TopEnd)
                ) {
                    Icon(Icons.Default.Delete, contentDescription = "Supprimer")
                }
            }
            Text(
                text = "${contrat.locataireNom} • ${contrat.bienNom}",
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = "${contrat.montantMensuel} GNF / mois",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = contrat.statut,
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}
