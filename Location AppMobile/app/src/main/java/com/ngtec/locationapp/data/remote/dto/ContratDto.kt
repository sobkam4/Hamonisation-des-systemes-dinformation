package com.ngtec.locationapp.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ContratDto(
    val id: Long,
    val client: Long? = null,
    val bien: Long? = null,
    val reference: String = "",
    @SerialName("client_nom")
    val locataireNom: String = "",
    @SerialName("bien_nom")
    val bienNom: String = "",
    @SerialName("montant_mensuel")
    val montantMensuel: Double = 0.0,
    val statut: String = "",
    @SerialName("date_debut") val dateDebut: String = "",
    @SerialName("date_fin") val dateFin: String = "",
    val caution: Double = 0.0
)

@Serializable
data class ContratCreateRequest(
    val client: Long,
    val bien: Long,
    @SerialName("date_debut") val dateDebut: String,
    @SerialName("date_fin") val dateFin: String,
    @SerialName("montant_mensuel")
    val montantMensuel: Double,
    val caution: Double,
    val statut: String
)
