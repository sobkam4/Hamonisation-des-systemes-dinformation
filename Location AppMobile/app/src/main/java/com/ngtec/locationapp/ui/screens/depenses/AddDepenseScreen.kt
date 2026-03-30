package com.ngtec.locationapp.ui.screens.depenses

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
fun AddDepenseScreen(
    onSaved: () -> Unit,
    viewModel: AddDepenseViewModel = hiltViewModel()
) {
    if (viewModel.isSaved) {
        LaunchedEffect(Unit) {
            onSaved()
            viewModel.consumeSaved()
        }
    }

    Scaffold(topBar = { TopAppBar(title = { Text("Nouvelle depense") }) }) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedTextField(value = viewModel.libelle, onValueChange = viewModel::onLibelleChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Description") })
            OutlinedTextField(value = viewModel.categorie, onValueChange = viewModel::onCategorieChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Categorie") })
            OutlinedTextField(value = viewModel.montant, onValueChange = viewModel::onMontantChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Montant") })
            OutlinedTextField(value = viewModel.dateDepense, onValueChange = viewModel::onDateChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Date depense (YYYY-MM-DD)") })
            SelectionField(
                label = "Bien (optionnel)",
                selectedLabel = viewModel.biens.firstOrNull { it.id.toString() == viewModel.bienId }?.let { bien ->
                    "${bien.nom} - ${bien.adresse}"
                }.orEmpty(),
                options = viewModel.biens.map { bien ->
                    SelectionOption(id = bien.id, label = "${bien.nom} - ${bien.adresse}")
                },
                onOptionSelected = { option -> viewModel.selectBien(option.id) }
            )
            OutlinedTextField(value = viewModel.fournisseur, onValueChange = viewModel::onFournisseurChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Fournisseur") })
            OutlinedTextField(value = viewModel.numeroFacture, onValueChange = viewModel::onNumeroFactureChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Numero facture") })
            OutlinedTextField(value = viewModel.notes, onValueChange = viewModel::onNotesChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Notes") })

            viewModel.errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error) }

            Button(onClick = viewModel::save, modifier = Modifier.fillMaxWidth(), enabled = !viewModel.isSaving) {
                Text(if (viewModel.isSaving) "Enregistrement..." else "Creer la depense")
            }
        }
    }
}
