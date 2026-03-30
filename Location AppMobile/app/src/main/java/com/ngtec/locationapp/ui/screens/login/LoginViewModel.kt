package com.ngtec.locationapp.ui.screens.login

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ngtec.locationapp.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    var email by mutableStateOf("")
        private set

    var password by mutableStateOf("")
        private set

    var isLoading by mutableStateOf(false)
        private set

    var errorMessage by mutableStateOf<String?>(null)
        private set

    var isLoggedIn by mutableStateOf(false)
        private set

    fun onEmailChanged(value: String) {
        email = value
    }

    fun onPasswordChanged(value: String) {
        password = value
    }

    fun login() {
        if (email.isBlank() || password.isBlank()) {
            errorMessage = "Veuillez renseigner votre email et mot de passe."
            return
        }

        viewModelScope.launch {
            isLoading = true
            errorMessage = null

            runCatching {
                authRepository.login(email.trim(), password)
            }.onSuccess {
                isLoggedIn = true
            }.onFailure { throwable ->
                errorMessage = throwable.message ?: "Connexion impossible."
            }

            isLoading = false
        }
    }

    fun consumeLoginSuccess() {
        isLoggedIn = false
    }
}
