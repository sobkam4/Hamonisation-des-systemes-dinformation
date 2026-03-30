package com.ngtec.locationapp.ui.screens.depenses

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ngtec.locationapp.data.repository.DepenseRepository
import com.ngtec.locationapp.domain.model.Depense
import com.ngtec.locationapp.ui.common.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

@HiltViewModel
class DepensesViewModel @Inject constructor(
    private val depenseRepository: DepenseRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<UiState<List<Depense>>>(UiState.Loading)
    val uiState: StateFlow<UiState<List<Depense>>> = _uiState.asStateFlow()

    init {
        observeLocalData()
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            runCatching {
                depenseRepository.refreshDepenses()
            }.onFailure { throwable ->
                if (_uiState.value !is UiState.Success) {
                    _uiState.value = UiState.Error(
                        throwable.message ?: "Impossible de charger les depenses."
                    )
                }
            }
        }
    }

    fun deleteDepense(id: Long) {
        viewModelScope.launch {
            runCatching { depenseRepository.deleteDepense(id) }
        }
    }

    private fun observeLocalData() {
        viewModelScope.launch {
            depenseRepository.observeDepenses().collect { items ->
                _uiState.value = UiState.Success(items)
            }
        }
    }
}
