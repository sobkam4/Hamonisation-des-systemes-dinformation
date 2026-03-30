package com.ngtec.locationapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "paiements")
data class PaiementEntity(
    @PrimaryKey val id: Long,
    val reference: String,
    val contratReference: String,
    val montant: Double,
    val datePaiement: String,
    val statut: String,
    val modePaiement: String
)
