package com.ngtec.locationapp.ui.screens.contrats

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ngtec.locationapp.data.repository.ContratRepository
import com.ngtec.locationapp.domain.model.Contrat
import com.ngtec.locationapp.ui.common.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

@HiltViewModel
class ContratsViewModel @Inject constructor(
    private val contratRepository: ContratRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<UiState<List<Contrat>>>(UiState.Loading)
    val uiState: StateFlow<UiState<List<Contrat>>> = _uiState.asStateFlow()

    init {
        observeLocalData()
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            runCatching {
                contratRepository.refreshContrats()
            }.onFailure { throwable ->
                if (_uiState.value !is UiState.Success) {
                    _uiState.value = UiState.Error(
                        throwable.message ?: "Impossible de charger les contrats."
                    )
                }
            }
        }
    }

    fun deleteContrat(id: Long) {
        viewModelScope.launch {
            runCatching { contratRepository.deleteContrat(id) }
        }
    }

    private fun observeLocalData() {
        viewModelScope.launch {
            contratRepository.observeContrats().collect { items ->
                _uiState.value = UiState.Success(items)
            }
        }
    }
}
