package com.ngtec.locationapp.ui.screens.paiements

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ngtec.locationapp.data.repository.ContratRepository
import com.ngtec.locationapp.data.repository.PaiementRepository
import com.ngtec.locationapp.domain.model.Contrat
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

@HiltViewModel
class AddPaiementViewModel @Inject constructor(
    private val paiementRepository: PaiementRepository,
    private val contratRepository: ContratRepository
) : ViewModel() {
    var reference by mutableStateOf("")
        private set
    var contratId by mutableStateOf("")
        private set
    var montant by mutableStateOf("")
        private set
    var datePaiement by mutableStateOf("")
        private set
    var dateEcheance by mutableStateOf("")
        private set
    var montantDu by mutableStateOf("")
        private set
    var moisPaye by mutableStateOf("")
        private set
    var statut by mutableStateOf("en_attente")
        private set
    var modePaiement by mutableStateOf("especes")
        private set
    var isSaving by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set
    var isSaved by mutableStateOf(false)
        private set
    var contrats by mutableStateOf<List<Contrat>>(emptyList())
        private set

    init {
        viewModelScope.launch {
            contratRepository.observeContrats().collect { items ->
                contrats = items
            }
        }
        viewModelScope.launch { contratRepository.refreshContrats() }
    }

    fun onReferenceChanged(value: String) { reference = value }
    fun onContratIdChanged(value: String) { contratId = value }
    fun onMontantChanged(value: String) { montant = value }
    fun onDatePaiementChanged(value: String) { datePaiement = value }
    fun onDateEcheanceChanged(value: String) { dateEcheance = value }
    fun onMontantDuChanged(value: String) { montantDu = value }
    fun onMoisPayeChanged(value: String) { moisPaye = value }
    fun onStatutChanged(value: String) { statut = value }
    fun onModeChanged(value: String) { modePaiement = value }
    fun selectContrat(id: Long) { contratId = id.toString() }

    fun save() {
        val contratIdValue = contratId.toLongOrNull()
        val montantValue = montant.toDoubleOrNull()
        val montantDuValue = montantDu.toDoubleOrNull()
        if (contratIdValue == null || montantValue == null || datePaiement.isBlank() || dateEcheance.isBlank()) {
            errorMessage = "Veuillez renseigner l'id contrat, les dates et un montant valide."
            return
        }

        viewModelScope.launch {
            isSaving = true
            errorMessage = null
            runCatching {
                paiementRepository.createPaiement(
                    contratId = contratIdValue,
                    reference = reference.trim().ifBlank { null },
                    montant = montantValue,
                    datePaiement = datePaiement.trim(),
                    dateEcheance = dateEcheance.trim(),
                    montantDu = montantDuValue,
                    moisPaye = moisPaye.trim().ifBlank { null },
                    statut = statut.trim(),
                    modePaiement = modePaiement.trim()
                )
            }.onSuccess {
                isSaved = true
            }.onFailure { throwable ->
                errorMessage = throwable.message ?: "Creation du paiement impossible."
            }
            isSaving = false
        }
    }

    fun consumeSaved() {
        isSaved = false
    }
}
