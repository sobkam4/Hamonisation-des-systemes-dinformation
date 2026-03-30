package com.ngtec.locationapp.domain.model

data class Paiement(
    val id: Long,
    val reference: String,
    val contratReference: String,
    val montant: Double,
    val datePaiement: String,
    val statut: String,
    val modePaiement: String
)
