package com.ngtec.locationapp.data.remote.api

import com.ngtec.locationapp.data.remote.dto.ClientCreateRequest
import com.ngtec.locationapp.data.remote.dto.ClientDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.POST

interface ClientApiService {
    @GET("clients")
    suspend fun getClients(): List<ClientDto>

    @POST("clients")
    suspend fun createClient(@Body request: ClientCreateRequest): ClientDto

    @DELETE("clients/{id}")
    suspend fun deleteClient(@Path("id") id: Long)
}
