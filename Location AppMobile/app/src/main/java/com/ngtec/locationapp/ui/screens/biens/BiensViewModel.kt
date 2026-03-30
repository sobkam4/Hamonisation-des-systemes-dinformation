package com.ngtec.locationapp.ui.screens.biens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ngtec.locationapp.data.repository.BienRepository
import com.ngtec.locationapp.domain.model.Bien
import com.ngtec.locationapp.ui.common.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

@HiltViewModel
class BiensViewModel @Inject constructor(
    private val bienRepository: BienRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<UiState<List<Bien>>>(UiState.Loading)
    val uiState: StateFlow<UiState<List<Bien>>> = _uiState.asStateFlow()

    init {
        observeLocalData()
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            runCatching {
                bienRepository.refreshBiens()
            }.onFailure { throwable ->
                if (_uiState.value !is UiState.Success) {
                    _uiState.value = UiState.Error(
                        throwable.message ?: "Impossible de charger les biens."
                    )
                }
            }
        }
    }

    fun deleteBien(id: Long) {
        viewModelScope.launch {
            runCatching { bienRepository.deleteBien(id) }
        }
    }

    private fun observeLocalData() {
        viewModelScope.launch {
            bienRepository.observeBiens().collect { items ->
                _uiState.value = UiState.Success(items)
            }
        }
    }
}
