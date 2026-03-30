package com.ngtec.locationapp.data.repository

import com.ngtec.locationapp.data.local.preferences.SessionPreferences
import com.ngtec.locationapp.data.remote.api.AuthApiService
import com.ngtec.locationapp.data.remote.dto.LoginRequest
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow

@Singleton
class AuthRepository @Inject constructor(
    private val authApiService: AuthApiService,
    private val sessionPreferences: SessionPreferences
) {
    val authTokenFlow: Flow<String?> = sessionPreferences.authTokenFlow

    suspend fun login(username: String, password: String) {
        val response = authApiService.login(
            request = LoginRequest(username = username, password = password)
        )
        sessionPreferences.saveToken(response.access)
    }

    suspend fun logout() {
        sessionPreferences.clear()
    }
}
