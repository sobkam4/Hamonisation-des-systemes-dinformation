package com.ngtec.locationapp.data.mapper

import com.ngtec.locationapp.data.local.entity.BienEntity
import com.ngtec.locationapp.data.remote.dto.BienDto
import com.ngtec.locationapp.domain.model.Bien

fun BienDto.toEntity(): BienEntity = BienEntity(
    id = id,
    nom = nom,
    typeBien = typeBienDisplay ?: typeBien,
    statut = statutDisplay ?: statut,
    montantMensuel = montantMensuel,
    adresse = adresse
)

fun BienEntity.toDomain(): Bien = Bien(
    id = id,
    nom = nom,
    typeBien = typeBien,
    statut = statut,
    montantMensuel = montantMensuel,
    adresse = adresse
)
