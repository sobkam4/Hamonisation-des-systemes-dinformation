package com.ngtec.locationapp.ui.screens.depenses

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ngtec.locationapp.data.repository.BienRepository
import com.ngtec.locationapp.data.repository.DepenseRepository
import com.ngtec.locationapp.domain.model.Bien
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

@HiltViewModel
class AddDepenseViewModel @Inject constructor(
    private val depenseRepository: DepenseRepository,
    private val bienRepository: BienRepository
) : ViewModel() {
    var libelle by mutableStateOf("")
        private set
    var categorie by mutableStateOf("")
        private set
    var montant by mutableStateOf("")
        private set
    var dateDepense by mutableStateOf("")
        private set
    var bienId by mutableStateOf("")
        private set
    var fournisseur by mutableStateOf("")
        private set
    var numeroFacture by mutableStateOf("")
        private set
    var notes by mutableStateOf("")
        private set
    var isSaving by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set
    var isSaved by mutableStateOf(false)
        private set
    var biens by mutableStateOf<List<Bien>>(emptyList())
        private set

    init {
        viewModelScope.launch {
            bienRepository.observeBiens().collect { items ->
                biens = items
            }
        }
        viewModelScope.launch { bienRepository.refreshBiens() }
    }

    fun onLibelleChanged(value: String) { libelle = value }
    fun onCategorieChanged(value: String) { categorie = value }
    fun onMontantChanged(value: String) { montant = value }
    fun onDateChanged(value: String) { dateDepense = value }
    fun onBienChanged(value: String) { bienId = value }
    fun onFournisseurChanged(value: String) { fournisseur = value }
    fun onNumeroFactureChanged(value: String) { numeroFacture = value }
    fun onNotesChanged(value: String) { notes = value }
    fun selectBien(id: Long) { bienId = id.toString() }

    fun save() {
        val montantValue = montant.toDoubleOrNull()
        val bienIdValue = bienId.toLongOrNull()
        if (libelle.isBlank() || categorie.isBlank() || montantValue == null || dateDepense.isBlank()) {
            errorMessage = "Veuillez renseigner libelle, categorie, date et montant valide."
            return
        }

        viewModelScope.launch {
            isSaving = true
            errorMessage = null
            runCatching {
                depenseRepository.createDepense(
                    libelle = libelle.trim(),
                    categorie = categorie.trim(),
                    montant = montantValue,
                    dateDepense = dateDepense.trim(),
                    bienId = bienIdValue,
                    fournisseur = fournisseur.trim().ifBlank { null },
                    numeroFacture = numeroFacture.trim().ifBlank { null },
                    notes = notes.trim().ifBlank { null }
                )
            }.onSuccess {
                isSaved = true
            }.onFailure { throwable ->
                errorMessage = throwable.message ?: "Creation de la depense impossible."
            }
            isSaving = false
        }
    }

    fun consumeSaved() {
        isSaved = false
    }
}
