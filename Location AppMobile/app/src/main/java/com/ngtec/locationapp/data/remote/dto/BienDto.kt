package com.ngtec.locationapp.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class BienDto(
    val id: Long,
    val nom: String,
    @SerialName("type_bien")
    val typeBien: String,
    val statut: String,
    @SerialName("prix_location")
    val montantMensuel: Double,
    val adresse: String = "",
    @SerialName("type_bien_display") val typeBienDisplay: String? = null,
    @SerialName("statut_display") val statutDisplay: String? = null
)

@Serializable
data class BienCreateRequest(
    val nom: String,
    @SerialName("type_bien")
    val typeBien: String,
    val statut: String,
    @SerialName("prix_location")
    val montantMensuel: Double,
    val adresse: String
)
