package com.ngtec.locationapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "depenses")
data class DepenseEntity(
    @PrimaryKey val id: Long,
    val libelle: String,
    val categorie: String,
    val montant: Double,
    val dateDepense: String,
    val bienNom: String,
    val statut: String
)
