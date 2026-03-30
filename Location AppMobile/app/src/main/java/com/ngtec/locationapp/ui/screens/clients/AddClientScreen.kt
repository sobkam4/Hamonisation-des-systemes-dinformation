package com.ngtec.locationapp.ui.screens.clients

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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddClientScreen(
    onSaved: () -> Unit,
    viewModel: AddClientViewModel = hiltViewModel()
) {
    if (viewModel.isSaved) {
        LaunchedEffect(Unit) {
            onSaved()
            viewModel.consumeSaved()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Nouveau client") })
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedTextField(
                value = viewModel.nom,
                onValueChange = viewModel::onNomChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Nom") }
            )
            OutlinedTextField(
                value = viewModel.prenom,
                onValueChange = viewModel::onPrenomChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Prenom") }
            )
            OutlinedTextField(
                value = viewModel.telephone,
                onValueChange = viewModel::onTelephoneChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Telephone") }
            )
            OutlinedTextField(
                value = viewModel.email,
                onValueChange = viewModel::onEmailChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Email") }
            )
            OutlinedTextField(
                value = viewModel.adresse,
                onValueChange = viewModel::onAdresseChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Adresse") }
            )
            OutlinedTextField(
                value = viewModel.pieceIdentite,
                onValueChange = viewModel::onPieceIdentiteChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Piece d'identite") }
            )
            OutlinedTextField(
                value = viewModel.numeroPieceIdentite,
                onValueChange = viewModel::onNumeroPieceChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Numero piece d'identite") }
            )

            viewModel.errorMessage?.let { message ->
                Text(
                    text = message,
                    color = MaterialTheme.colorScheme.error
                )
            }

            Button(
                onClick = viewModel::save,
                modifier = Modifier.fillMaxWidth(),
                enabled = !viewModel.isSaving
            ) {
                Text(if (viewModel.isSaving) "Enregistrement..." else "Creer le client")
            }
        }
    }
}
