package com.ngtec.locationapp.data.remote.api

import com.ngtec.locationapp.data.remote.dto.PaiementCreateRequest
import com.ngtec.locationapp.data.remote.dto.PaiementDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface PaiementApiService {
    @GET("paiements")
    suspend fun getPaiements(): List<PaiementDto>

    @POST("paiements")
    suspend fun createPaiement(@Body request: PaiementCreateRequest): PaiementDto

    @DELETE("paiements/{id}")
    suspend fun deletePaiement(@Path("id") id: Long)
}
