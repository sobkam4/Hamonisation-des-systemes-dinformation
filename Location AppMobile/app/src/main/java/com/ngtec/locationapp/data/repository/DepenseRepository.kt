package com.ngtec.locationapp.data.repository

import com.ngtec.locationapp.data.local.dao.DepenseDao
import com.ngtec.locationapp.data.mapper.toDomain
import com.ngtec.locationapp.data.mapper.toEntity
import com.ngtec.locationapp.data.remote.api.DepenseApiService
import com.ngtec.locationapp.data.remote.dto.DepenseCreateRequest
import com.ngtec.locationapp.domain.model.Depense
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

@Singleton
class DepenseRepository @Inject constructor(
    private val depenseApiService: DepenseApiService,
    private val depenseDao: DepenseDao
) {
    fun observeDepenses(): Flow<List<Depense>> = depenseDao.observeAll().map { items ->
        items.map { entity -> entity.toDomain() }
    }

    suspend fun refreshDepenses() {
        val remoteItems = depenseApiService.getDepenses()
        depenseDao.clearAll()
        depenseDao.insertAll(remoteItems.map { dto -> dto.toEntity() })
    }

    suspend fun createDepense(
        libelle: String,
        categorie: String,
        montant: Double,
        dateDepense: String,
        bienId: Long? = null,
        fournisseur: String? = null,
        numeroFacture: String? = null,
        notes: String? = null
    ): Depense {
        val created = depenseApiService.createDepense(
            request = DepenseCreateRequest(
                libelle = libelle,
                categorie = categorie,
                montant = montant,
                dateDepense = dateDepense,
                bien = bienId,
                fournisseur = fournisseur,
                numeroFacture = numeroFacture,
                notes = notes
            )
        )
        val entity = created.toEntity()
        depenseDao.insertAll(listOf(entity))
        return entity.toDomain()
    }

    suspend fun deleteDepense(id: Long) {
        depenseApiService.deleteDepense(id)
        depenseDao.deleteById(id)
    }
}
