package com.ngtec.locationapp.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ngtec.locationapp.data.repository.BienRepository
import com.ngtec.locationapp.data.repository.ClientRepository
import com.ngtec.locationapp.data.repository.ContratRepository
import com.ngtec.locationapp.data.repository.DepenseRepository
import com.ngtec.locationapp.data.repository.PaiementRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch

data class DashboardUiState(
    val totalBiens: Int = 0,
    val totalClients: Int = 0,
    val totalContrats: Int = 0,
    val totalPaiements: Int = 0,
    val totalDepenses: Int = 0,
    val revenusMensuels: Double = 0.0,
    val encaissements: Double = 0.0,
    val depenses: Double = 0.0,
    val soldeNet: Double = 0.0,
    val isRefreshing: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val bienRepository: BienRepository,
    private val clientRepository: ClientRepository,
    private val contratRepository: ContratRepository,
    private val paiementRepository: PaiementRepository,
    private val depenseRepository: DepenseRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState(isRefreshing = true))
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        observeDashboard()
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isRefreshing = true, errorMessage = null)

            var errorMessage: String? = null

            runCatching { bienRepository.refreshBiens() }
                .onFailure { errorMessage = it.message ?: "Erreur de synchronisation des biens." }

            runCatching { clientRepository.refreshClients() }
                .onFailure { if (errorMessage == null) errorMessage = it.message ?: "Erreur de synchronisation des clients." }

            runCatching { contratRepository.refreshContrats() }
                .onFailure { if (errorMessage == null) errorMessage = it.message ?: "Erreur de synchronisation des contrats." }

            runCatching { paiementRepository.refreshPaiements() }
                .onFailure { if (errorMessage == null) errorMessage = it.message ?: "Erreur de synchronisation des paiements." }

            runCatching { depenseRepository.refreshDepenses() }
                .onFailure { if (errorMessage == null) errorMessage = it.message ?: "Erreur de synchronisation des depenses." }

            _uiState.value = _uiState.value.copy(
                isRefreshing = false,
                errorMessage = errorMessage
            )
        }
    }

    private fun observeDashboard() {
        viewModelScope.launch {
            combine(
                bienRepository.observeBiens(),
                clientRepository.observeClients(),
                contratRepository.observeContrats(),
                paiementRepository.observePaiements(),
                depenseRepository.observeDepenses()
            ) { biens, clients, contrats, paiements, depenses ->
                val encaissements = paiements.sumOf { it.montant }
                val totalDepenses = depenses.sumOf { it.montant }
                DashboardUiState(
                    totalBiens = biens.size,
                    totalClients = clients.size,
                    totalContrats = contrats.size,
                    totalPaiements = paiements.size,
                    totalDepenses = depenses.size,
                    revenusMensuels = contrats.sumOf { it.montantMensuel },
                    encaissements = encaissements,
                    depenses = totalDepenses,
                    soldeNet = encaissements - totalDepenses,
                    isRefreshing = _uiState.value.isRefreshing,
                    errorMessage = _uiState.value.errorMessage
                )
            }.collect { state ->
                _uiState.value = state
            }
        }
    }
}
