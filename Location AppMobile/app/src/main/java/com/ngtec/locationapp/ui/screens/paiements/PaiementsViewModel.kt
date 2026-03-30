package com.ngtec.locationapp.ui.screens.paiements

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ngtec.locationapp.data.repository.PaiementRepository
import com.ngtec.locationapp.domain.model.Paiement
import com.ngtec.locationapp.ui.common.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

@HiltViewModel
class PaiementsViewModel @Inject constructor(
    private val paiementRepository: PaiementRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<UiState<List<Paiement>>>(UiState.Loading)
    val uiState: StateFlow<UiState<List<Paiement>>> = _uiState.asStateFlow()

    init {
        observeLocalData()
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            runCatching {
                paiementRepository.refreshPaiements()
            }.onFailure { throwable ->
                if (_uiState.value !is UiState.Success) {
                    _uiState.value = UiState.Error(
                        throwable.message ?: "Impossible de charger les paiements."
                    )
                }
            }
        }
    }

    fun deletePaiement(id: Long) {
        viewModelScope.launch {
            runCatching { paiementRepository.deletePaiement(id) }
        }
    }

    private fun observeLocalData() {
        viewModelScope.launch {
            paiementRepository.observePaiements().collect { items ->
                _uiState.value = UiState.Success(items)
            }
        }
    }
}
