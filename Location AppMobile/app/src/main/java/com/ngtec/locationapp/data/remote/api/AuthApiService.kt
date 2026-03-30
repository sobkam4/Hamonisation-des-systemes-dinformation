package com.ngtec.locationapp.data.remote.api

import com.ngtec.locationapp.data.remote.dto.LoginRequest
import com.ngtec.locationapp.data.remote.dto.LoginResponse
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse
}
