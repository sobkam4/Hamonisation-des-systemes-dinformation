package com.ngtec.locationapp.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ClientDto(
    val id: Long,
    @SerialName("nom_complet")
    val nomComplet: String,
    val nom: String = "",
    val prenom: String = "",
    val telephone: String = "",
    val email: String = "",
    val adresse: String = "",
    @SerialName("piece_identite") val pieceIdentite: String? = null,
    @SerialName("numero_piece_identite") val numeroPieceIdentite: String? = null
)

@Serializable
data class ClientCreateRequest(
    val nom: String,
    val prenom: String,
    val telephone: String,
    val email: String,
    val adresse: String,
    @SerialName("piece_identite") val pieceIdentite: String,
    @SerialName("numero_piece_identite") val numeroPieceIdentite: String? = null,
    val notes: String? = null
)
