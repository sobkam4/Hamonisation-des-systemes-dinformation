package com.ngtec.locationapp.ui.screens.clients

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ngtec.locationapp.data.repository.ClientRepository
import com.ngtec.locationapp.domain.model.Client
import com.ngtec.locationapp.ui.common.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

@HiltViewModel
class ClientsViewModel @Inject constructor(
    private val clientRepository: ClientRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<UiState<List<Client>>>(UiState.Loading)
    val uiState: StateFlow<UiState<List<Client>>> = _uiState.asStateFlow()

    init {
        observeLocalData()
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            runCatching {
                clientRepository.refreshClients()
            }.onFailure { throwable ->
                if (_uiState.value !is UiState.Success) {
                    _uiState.value = UiState.Error(
                        throwable.message ?: "Impossible de charger les clients."
                    )
                }
            }
        }
    }

    fun deleteClient(id: Long) {
        viewModelScope.launch {
            runCatching { clientRepository.deleteClient(id) }
        }
    }

    private fun observeLocalData() {
        viewModelScope.launch {
            clientRepository.observeClients().collect { items ->
                _uiState.value = UiState.Success(items)
            }
        }
    }
}
