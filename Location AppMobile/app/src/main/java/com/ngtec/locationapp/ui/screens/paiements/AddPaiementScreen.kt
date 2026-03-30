package com.ngtec.locationapp.ui.screens.paiements

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
fun AddPaiementScreen(
    onSaved: () -> Unit,
    viewModel: AddPaiementViewModel = hiltViewModel()
) {
    if (viewModel.isSaved) {
        LaunchedEffect(Unit) {
            onSaved()
            viewModel.consumeSaved()
        }
    }

    Scaffold(topBar = { TopAppBar(title = { Text("Nouveau paiement") }) }) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedTextField(value = viewModel.reference, onValueChange = viewModel::onReferenceChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Reference") })
            SelectionField(
                label = "Contrat",
                selectedLabel = viewModel.contrats.firstOrNull { it.id.toString() == viewModel.contratId }?.let { contrat ->
                    "${contrat.reference} - ${contrat.locataireNom}"
                }.orEmpty(),
                options = viewModel.contrats.map { contrat ->
                    SelectionOption(id = contrat.id, label = "${contrat.reference} - ${contrat.locataireNom}")
                },
                onOptionSelected = { option -> viewModel.selectContrat(option.id) }
            )
            OutlinedTextField(value = viewModel.montant, onValueChange = viewModel::onMontantChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Montant") })
            OutlinedTextField(value = viewModel.montantDu, onValueChange = viewModel::onMontantDuChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Montant du") })
            OutlinedTextField(value = viewModel.datePaiement, onValueChange = viewModel::onDatePaiementChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Date paiement (YYYY-MM-DD)") })
            OutlinedTextField(value = viewModel.dateEcheance, onValueChange = viewModel::onDateEcheanceChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Date echeance (YYYY-MM-DD)") })
            OutlinedTextField(value = viewModel.moisPaye, onValueChange = viewModel::onMoisPayeChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Mois paye (YYYY-MM)") })
            OutlinedTextField(value = viewModel.statut, onValueChange = viewModel::onStatutChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Statut") })
            OutlinedTextField(value = viewModel.modePaiement, onValueChange = viewModel::onModeChanged, modifier = Modifier.fillMaxWidth(), label = { Text("Mode de paiement") })

            viewModel.errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error) }

            Button(onClick = viewModel::save, modifier = Modifier.fillMaxWidth(), enabled = !viewModel.isSaving) {
                Text(if (viewModel.isSaving) "Enregistrement..." else "Creer le paiement")
            }
        }
    }
}
