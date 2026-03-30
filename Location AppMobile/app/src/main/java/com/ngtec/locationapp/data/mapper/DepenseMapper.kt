package com.ngtec.locationapp.data.mapper

import com.ngtec.locationapp.data.local.entity.DepenseEntity
import com.ngtec.locationapp.data.remote.dto.DepenseDto
import com.ngtec.locationapp.domain.model.Depense

fun DepenseDto.toEntity(): DepenseEntity = DepenseEntity(
    id = id,
    libelle = libelle,
    categorie = categorie,
    montant = montant,
    dateDepense = dateDepense,
    bienNom = bienNom,
    statut = statut
)

fun DepenseEntity.toDomain(): Depense = Depense(
    id = id,
    libelle = libelle,
    categorie = categorie,
    montant = montant,
    dateDepense = dateDepense,
    bienNom = bienNom,
    statut = statut
)
