package com.ngtec.locationapp.ui.screens.biens

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ngtec.locationapp.data.repository.BienRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

@HiltViewModel
class AddBienViewModel @Inject constructor(
    private val bienRepository: BienRepository
) : ViewModel() {

    var nom by mutableStateOf("")
        private set
    var typeBien by mutableStateOf("")
        private set
    var statut by mutableStateOf("disponible")
        private set
    var montantMensuel by mutableStateOf("")
        private set
    var adresse by mutableStateOf("")
        private set
    var isSaving by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set
    var isSaved by mutableStateOf(false)
        private set

    fun onNomChanged(value: String) { nom = value }
    fun onTypeBienChanged(value: String) { typeBien = value }
    fun onStatutChanged(value: String) { statut = value }
    fun onMontantChanged(value: String) { montantMensuel = value }
    fun onAdresseChanged(value: String) { adresse = value }

    fun save() {
        val montant = montantMensuel.toDoubleOrNull()
        if (nom.isBlank() || typeBien.isBlank() || montant == null) {
            errorMessage = "Veuillez renseigner le nom, le type et un montant valide."
            return
        }

        viewModelScope.launch {
            isSaving = true
            errorMessage = null

            runCatching {
                bienRepository.createBien(
                    nom = nom.trim(),
                    typeBien = typeBien.trim(),
                    statut = statut.trim(),
                    montantMensuel = montant,
                    adresse = adresse.trim()
                )
            }.onSuccess {
                isSaved = true
            }.onFailure { throwable ->
                errorMessage = throwable.message ?: "Creation du bien impossible."
            }

            isSaving = false
        }
    }

    fun consumeSaved() {
        isSaved = false
    }
}
