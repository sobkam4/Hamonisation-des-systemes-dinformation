package com.ngtec.locationapp.data.mapper

import com.ngtec.locationapp.data.local.entity.ContratEntity
import com.ngtec.locationapp.data.remote.dto.ContratDto
import com.ngtec.locationapp.domain.model.Contrat

fun ContratDto.toEntity(): ContratEntity = ContratEntity(
    id = id,
    reference = if (reference.isNotBlank()) reference else "Contrat #$id",
    locataireNom = locataireNom,
    bienNom = bienNom,
    montantMensuel = montantMensuel,
    statut = statut
)

fun ContratEntity.toDomain(): Contrat = Contrat(
    id = id,
    reference = reference,
    locataireNom = locataireNom,
    bienNom = bienNom,
    montantMensuel = montantMensuel,
    statut = statut
)
