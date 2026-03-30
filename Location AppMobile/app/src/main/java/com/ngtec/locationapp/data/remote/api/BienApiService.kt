package com.ngtec.locationapp.data.remote.api

import com.ngtec.locationapp.data.remote.dto.BienCreateRequest
import com.ngtec.locationapp.data.remote.dto.BienDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.POST

interface BienApiService {
    @GET("biens")
    suspend fun getBiens(): List<BienDto>

    @POST("biens")
    suspend fun createBien(@Body request: BienCreateRequest): BienDto

    @DELETE("biens/{id}")
    suspend fun deleteBien(@Path("id") id: Long)
}
