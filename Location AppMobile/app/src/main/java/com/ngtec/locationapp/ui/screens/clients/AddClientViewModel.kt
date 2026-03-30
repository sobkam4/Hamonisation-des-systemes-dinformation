package com.ngtec.locationapp.ui.screens.clients

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ngtec.locationapp.data.repository.ClientRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

@HiltViewModel
class AddClientViewModel @Inject constructor(
    private val clientRepository: ClientRepository
) : ViewModel() {

    var nom by mutableStateOf("")
        private set
    var prenom by mutableStateOf("")
        private set
    var telephone by mutableStateOf("")
        private set
    var email by mutableStateOf("")
        private set
    var adresse by mutableStateOf("")
        private set
    var pieceIdentite by mutableStateOf("CNI")
        private set
    var numeroPieceIdentite by mutableStateOf("")
        private set
    var isSaving by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set
    var isSaved by mutableStateOf(false)
        private set

    fun onNomChanged(value: String) { nom = value }
    fun onPrenomChanged(value: String) { prenom = value }
    fun onTelephoneChanged(value: String) { telephone = value }
    fun onEmailChanged(value: String) { email = value }
    fun onAdresseChanged(value: String) { adresse = value }
    fun onPieceIdentiteChanged(value: String) { pieceIdentite = value }
    fun onNumeroPieceChanged(value: String) { numeroPieceIdentite = value }

    fun save() {
        if (nom.isBlank() || prenom.isBlank() || email.isBlank() || telephone.isBlank() || adresse.isBlank()) {
            errorMessage = "Veuillez renseigner nom, prenom, email, telephone et adresse."
            return
        }

        viewModelScope.launch {
            isSaving = true
            errorMessage = null

            runCatching {
                clientRepository.createClient(
                    nom = nom.trim(),
                    prenom = prenom.trim(),
                    telephone = telephone.trim(),
                    email = email.trim(),
                    adresse = adresse.trim(),
                    pieceIdentite = pieceIdentite.trim(),
                    numeroPieceIdentite = numeroPieceIdentite.trim().ifBlank { null }
                )
            }.onSuccess {
                isSaved = true
            }.onFailure { throwable ->
                errorMessage = throwable.message ?: "Creation du client impossible."
            }

            isSaving = false
        }
    }

    fun consumeSaved() {
        isSaved = false
    }
}
