package com.ngtec.locationapp.data.remote.api

import com.ngtec.locationapp.data.remote.dto.ContratCreateRequest
import com.ngtec.locationapp.data.remote.dto.ContratDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ContratApiService {
    @GET("contrats")
    suspend fun getContrats(): List<ContratDto>

    @POST("contrats")
    suspend fun createContrat(@Body request: ContratCreateRequest): ContratDto

    @DELETE("contrats/{id}")
    suspend fun deleteContrat(@Path("id") id: Long)
}
