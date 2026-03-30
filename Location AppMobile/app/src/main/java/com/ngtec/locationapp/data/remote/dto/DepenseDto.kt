package com.ngtec.locationapp.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class DepenseDto(
    val id: Long,
    @SerialName("description")
    val libelle: String,
    @SerialName("categorie_nom")
    val categorie: String = "",
    val montant: Double = 0.0,
    @SerialName("date")
    val dateDepense: String = "",
    @SerialName("bien_nom")
    val bienNom: String = "",
    @SerialName("type_depense_display")
    val statut: String = "",
    val bien: Long? = null
)

@Serializable
data class DepenseCreateRequest(
    @SerialName("description")
    val libelle: String,
    val categorie: String,
    val montant: Double,
    @SerialName("date")
    val dateDepense: String,
    val bien: Long? = null,
    val fournisseur: String? = null,
    @SerialName("numero_facture") val numeroFacture: String? = null,
    val notes: String? = null
)
