package com.ngtec.locationapp.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val username: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val access: String,
    val refresh: String? = null,
    val user: UserDto? = null
)

@Serializable
data class UserDto(
    val id: Long,
    val username: String,
    val email: String? = null,
    @SerialName("first_name") val firstName: String = "",
    @SerialName("last_name") val lastName: String = "",
    val role: String,
    val telephone: String? = null
)
