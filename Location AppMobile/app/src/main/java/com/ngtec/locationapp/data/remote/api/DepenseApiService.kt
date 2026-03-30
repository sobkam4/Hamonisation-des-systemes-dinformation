package com.ngtec.locationapp.data.remote.api

import com.ngtec.locationapp.data.remote.dto.DepenseCreateRequest
import com.ngtec.locationapp.data.remote.dto.DepenseDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface DepenseApiService {
    @GET("depenses")
    suspend fun getDepenses(): List<DepenseDto>

    @POST("depenses")
    suspend fun createDepense(@Body request: DepenseCreateRequest): DepenseDto

    @DELETE("depenses/{id}")
    suspend fun deleteDepense(@Path("id") id: Long)
}
