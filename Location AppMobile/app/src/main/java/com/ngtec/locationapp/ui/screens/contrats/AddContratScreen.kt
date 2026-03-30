package com.ngtec.locationapp.ui.screens.contrats

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ngtec.locationapp.ui.components.SelectionField
import com.ngtec.locationapp.ui.components.SelectionOption

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddContratScreen(
    onSaved: () -> Unit,
    viewModel: AddContratViewModel = hiltViewModel()
) {
    if (viewModel.isSaved) {
        LaunchedEffect(Unit) {
            onSaved()
            viewModel.consumeSaved()
        }
    }

    Scaffold(topBar = { TopAppBar(title = { Text("Nouveau contrat") }) }) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            SelectionField(
                label = "Client",
                selectedLabel = viewModel.clients.firstOrNull { it.id.toString() == viewModel.clientId }?.nomComplet.orEmpty(),
                options = viewModel.clients.map { client ->
                    SelectionOption(id = client.id, label = client.nomComplet)
                },
                onOptionSelected = { option -> viewModel.selectClient(option.id) }
            )
            SelectionField(
                label = "Bien",
                selectedLabel = viewModel.biens.firstOrNull { it.id.toString() == viewModel.bienId }?.let { bien ->
                    "${bien.nom} - ${bien.adresse}"
                }.orEmpty(),
                options = viewModel.biens.map { bien ->
                    SelectionOption(id = bien.id, label = "${bien.nom} - ${bien.adresse}")
                },
                onOptionSelected = { option -> viewModel.selectBien(option.id) }
            )
            OutlinedTextField(value = viewModel.dateDebut, onValueChange = viewModel::onDateDebutChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Date debut (YYYY-MM-DD)") })
            OutlinedTextField(value = viewModel.dateFin, onValueChange = viewModel::onDateFinChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Date fin (YYYY-MM-DD)") })
            OutlinedTextField(value = viewModel.montantMensuel, onValueChange = viewModel::onMontantChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Montant mensuel") })
            OutlinedTextField(value = viewModel.caution, onValueChange = viewModel::onCautionChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Caution") })
            OutlinedTextField(value = viewModel.statut, onValueChange = viewModel::onStatutChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Statut") })

            viewModel.errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error) }

            Button(onClick = viewModel::save, modifier = Modifier.fillMaxWidth(), enabled = !viewModel.isSaving) {
                Text(if (viewModel.isSaving) "Enregistrement..." else "Creer le contrat")
            }
        }
    }
}
