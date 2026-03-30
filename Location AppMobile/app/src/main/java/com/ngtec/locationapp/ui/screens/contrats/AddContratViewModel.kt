package com.ngtec.locationapp.ui.screens.contrats

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ngtec.locationapp.data.repository.BienRepository
import com.ngtec.locationapp.data.repository.ClientRepository
import com.ngtec.locationapp.data.repository.ContratRepository
import com.ngtec.locationapp.domain.model.Bien
import com.ngtec.locationapp.domain.model.Client
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

@HiltViewModel
class AddContratViewModel @Inject constructor(
    private val contratRepository: ContratRepository,
    private val clientRepository: ClientRepository,
    private val bienRepository: BienRepository
) : ViewModel() {
    var clientId by mutableStateOf("")
        private set
    var bienId by mutableStateOf("")
        private set
    var dateDebut by mutableStateOf("")
        private set
    var dateFin by mutableStateOf("")
        private set
    var montantMensuel by mutableStateOf("")
        private set
    var caution by mutableStateOf("")
        private set
    var statut by mutableStateOf("en_attente")
        private set
    var isSaving by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set
    var isSaved by mutableStateOf(false)
        private set
    var clients by mutableStateOf<List<Client>>(emptyList())
        private set
    var biens by mutableStateOf<List<Bien>>(emptyList())
        private set

    init {
        viewModelScope.launch {
            clientRepository.observeClients().collect { items ->
                clients = items
            }
        }
        viewModelScope.launch {
            bienRepository.observeBiens().collect { items ->
                biens = items
            }
        }
        viewModelScope.launch { clientRepository.refreshClients() }
        viewModelScope.launch { bienRepository.refreshBiens() }
    }

    fun onClientIdChanged(value: String) { clientId = value }
    fun onBienIdChanged(value: String) { bienId = value }
    fun onDateDebutChanged(value: String) { dateDebut = value }
    fun onDateFinChanged(value: String) { dateFin = value }
    fun onMontantChanged(value: String) { montantMensuel = value }
    fun onCautionChanged(value: String) { caution = value }
    fun onStatutChanged(value: String) { statut = value }
    fun selectClient(id: Long) { clientId = id.toString() }
    fun selectBien(id: Long) { bienId = id.toString() }

    fun save() {
        val clientIdValue = clientId.toLongOrNull()
        val bienIdValue = bienId.toLongOrNull()
        val montant = montantMensuel.toDoubleOrNull()
        val cautionValue = caution.toDoubleOrNull()
        if (clientIdValue == null || bienIdValue == null || dateDebut.isBlank() || dateFin.isBlank() || montant == null || cautionValue == null) {
            errorMessage = "Veuillez renseigner les ids, dates, montant et caution valides."
            return
        }

        viewModelScope.launch {
            isSaving = true
            errorMessage = null
            runCatching {
                contratRepository.createContrat(
                    clientId = clientIdValue,
                    bienId = bienIdValue,
                    dateDebut = dateDebut.trim(),
                    dateFin = dateFin.trim(),
                    montantMensuel = montant,
                    caution = cautionValue,
                    statut = statut.trim()
                )
            }.onSuccess {
                isSaved = true
            }.onFailure { throwable ->
                errorMessage = throwable.message ?: "Creation du contrat impossible."
            }
            isSaving = false
        }
    }

    fun consumeSaved() {
        isSaved = false
    }
}
