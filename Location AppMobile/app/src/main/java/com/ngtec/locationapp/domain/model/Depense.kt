package com.ngtec.locationapp.domain.model

data class Depense(
    val id: Long,
    val libelle: String,
    val categorie: String,
    val montant: Double,
    val dateDepense: String,
    val bienNom: String,
    val statut: String
)
