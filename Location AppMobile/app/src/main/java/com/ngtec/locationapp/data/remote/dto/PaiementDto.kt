package com.ngtec.locationapp.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class PaiementDto(
    val id: Long,
    val contrat: Long? = null,
    @SerialName("reference_paiement")
    val reference: String? = null,
    val montant: Double = 0.0,
    @SerialName("date_paiement")
    val datePaiement: String = "",
    @SerialName("statut_display")
    val statutDisplay: String? = null,
    val statut: String = "",
    @SerialName("type_paiement")
    val modePaiement: String = "",
    @SerialName("contrat_reference") val contratReference: String? = null,
    @SerialName("date_echeance") val dateEcheance: String = "",
    @SerialName("montant_du") val montantDu: Double = 0.0,
    @SerialName("mois_paye") val moisPaye: String? = null,
    @SerialName("client_nom") val clientNom: String? = null,
    @SerialName("bien_nom") val bienNom: String? = null
)

@Serializable
data class PaiementCreateRequest(
    val contrat: Long,
    val montant: Double,
    @SerialName("date_paiement") val datePaiement: String,
    @SerialName("date_echeance") val dateEcheance: String,
    @SerialName("montant_du") val montantDu: Double? = null,
    @SerialName("mois_paye") val moisPaye: String? = null,
    val statut: String,
    @SerialName("type_paiement") val modePaiement: String,
    @SerialName("reference_paiement") val reference: String? = null
)
