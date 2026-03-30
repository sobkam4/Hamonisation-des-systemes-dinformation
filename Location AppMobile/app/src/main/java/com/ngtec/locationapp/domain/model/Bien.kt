package com.ngtec.locationapp.domain.model

data class Bien(
    val id: Long,
    val nom: String,
    val typeBien: String,
    val statut: String,
    val montantMensuel: Double,
    val adresse: String
)
