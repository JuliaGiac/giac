// -*- mode:C++ ; compile-command: "g++ -DHAVE_CONFIG_H -m32 -I. -I.. -DIN_GIAC -DGIAC_GENERIC_CONSTANTS  -g -c -fno-strict-aliasing proba.cc" -*-
#include "giacPCH.h"
/*
 *  Copyright (C) 2000,2014 B. Parisse, Institut Fourier, 38402 St Martin d'Heres
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
using namespace std;
#include <stdexcept>
#include <cmath>
#include <math.h>
#include <algorithm>
#include <cstdlib>
#include <utility>
#include "sym2poly.h"
#include "usual.h"
#include "proba.h"
#include "solve.h"
#include "intg.h"
#include "permu.h"
#include "giacintl.h"
#include "misc.h"
#ifdef HAVE_LIBGSL
#include <gsl/gsl_sf_airy.h>
#include <gsl/gsl_sf_erf.h>
#endif

#ifndef NO_NAMESPACE_GIAC
namespace giac {
#endif // ndef NO_NAMESPACE_GIAC
gen _Test(const gen & args,GIAC_CONTEXT){
    if ( args.type==_STRNG && args.subtype==-1) return  args;
    if (args.type!=_VECT)
      return args;
    vecteur v=*args._VECTptr;
    int s=int(v.size());
    gen somme = 0;
    for (int i = 0; i < s; ++i) { somme = somme + v[i];}
    
    return somme;
  }
  static const char _Test_s []="Test";
  static define_unary_function_eval (__Test,&_Test,_Test_s);
  define_unary_function_ptr5( at_Test ,alias_at_Test,&__Test,0,true);


/// Etant donné une matrice X de données (taille n x p), renvoie la matrice de covariance (taille p x p)
gen _cov_matrix(const gen & _args, GIAC_CONTEXT){
    gen args = evalf(_args, 1, contextptr);
    if (args.type == _STRNG && args.subtype == -1) return args;
    
    if (args.type != _VECT || !ckmatrix(*args._VECTptr)) return gensizeerr("Matrice attendue");
    vecteur X = *args._VECTptr;    
    int n = X.size(); // lignes
    int p = X[0]._VECTptr->size(); //colonnes

    if (n == 0) {
        return gensizeerr("La matrice de données ne doit pas être vide");
    }
    if (p == 0) {
        return gensizeerr("Les lignes de la matrice ne doivent pas être vides");
    }

    // les moyennes de chaque colonne
    vecteur moyennes; 
    for (int j = 0; j < p; ++j) {
        gen somme = 0;
        for (int i = 0; i < n; ++i) {
            vecteur ligne = *X[i]._VECTptr;
            somme = somme + ligne[j];
        }
        moyennes.push_back(somme / n); // moyenne de la colonne j
    }

    vecteur matrice_finale; 
    
    for (int i = 0; i < p; ++i) {
        vecteur ligne_cov; 
        
        for (int j = 0; j < p; ++j) {
            gen somme_formule = 0;
            
            for (int k = 0; k < n; ++k) {
                vecteur ligne_data = *X[k]._VECTptr;
                somme_formule = somme_formule + (ligne_data[i] - moyennes[i]) * (ligne_data[j] - moyennes[j]);
            }
            ligne_cov.push_back(somme_formule / n);
        }
        matrice_finale.push_back(ligne_cov); 
    }
    return matrice_finale;
}
static const char _cov_matrix_s []="cov_matrix";
static define_unary_function_eval (__cov_matrix, &_cov_matrix, _cov_matrix_s);
define_unary_function_ptr5(at_cov_matrix, alias_at_cov_matrix, &__cov_matrix, 0, true);

static bool tri_dec(const gen & a, const gen & b) {
  return a > b;
}

/// Etant donné une matrice de cov Sigma, renvoie la liste de ses valeurs propres par ordre décroissant
gen _pca_eigenvalues(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;

    if (args.type != _VECT || !ckmatrix(*args._VECTptr)) return gensizeerr("Matrice attendue");

    gen eigenvals_list_sorted_gen = _eigenvals(args, contextptr);

    vecteur eigenvals_list_sorted = *eigenvals_list_sorted_gen._VECTptr;

    std::sort(eigenvals_list_sorted.begin(), eigenvals_list_sorted.end(), tri_dec);

    return eigenvals_list_sorted;
}
    static const char _pca_eigenvalues_s []="pca_eigenvalues";
    static define_unary_function_eval (__pca_eigenvalues, &_pca_eigenvalues, _pca_eigenvalues_s);
    define_unary_function_ptr5(at_pca_eigenvalues, alias_at_pca_eigenvalues, &__pca_eigenvalues, 0, true);



// Etant donné un vecteur de valeurs propres ordonné, renvoie une liste des ratios de variance expliquée par chaque composante principale
gen _pca_explained_ratio(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;

    if (args.type != _VECT) return gensizeerr("Vecteur des valeurs propres attendu (ex: [6, 1])");
    vecteur ev = *args._VECTptr;
    int taille = ev.size();

    if (taille == 0) return gensizeerr("Le vecteur ne peut pas etre vide");

    gen somme_totale = 0;
    for (int i = 0; i < taille; ++i) {
        somme_totale = somme_totale + ev[i];
    }
    vecteur ratios;
    for (int i = 0; i < taille; ++i) {
        ratios.push_back(ev[i] / somme_totale);
    }

    return ratios;
}
static const char _pca_explained_ratio_s []="pca_explained_ratio";
static define_unary_function_eval (__pca_explained_ratio, &_pca_explained_ratio, _pca_explained_ratio_s);
define_unary_function_ptr5(at_pca_explained_ratio, alias_at_pca_explained_ratio, &__pca_explained_ratio, 0, true);



// Etant donné une matrice de cov Sigma et un seuil de variance expliquée (entre 0 et 1),
// renvoie le plus petit entier q tel que les q premières composantes expliquent au moins ce seuil
gen _pca_select_q(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;

    if (args.type != _VECT || args._VECTptr->size() != 2)
        return gensizeerr("Deux arguments attendus : [Sigma, seuil]");

    gen gSigma = (*args._VECTptr)[0];
    gen gseuil = evalf((*args._VECTptr)[1], 1, contextptr);

    if (gSigma.type != _VECT || !ckmatrix(*gSigma._VECTptr))
        return gensizeerr("Le premier argument doit être une matrice de covariance");

    if (gseuil.type != _DOUBLE_ && gseuil.type != _INT_)
        return gensizeerr("Le seuil doit être un réel entre 0 et 1");

    double seuil = gseuil.type == _DOUBLE_ ? gseuil._DOUBLE_val : (double)gseuil.val;

    if (seuil <= 0.0 || seuil > 1.0)
        return gensizeerr("Le seuil doit être strictement positif et au plus égal à 1");

    gen eigenvals_gen = _pca_eigenvalues(gSigma, contextptr);
    if (eigenvals_gen.type != _VECT) return eigenvals_gen;

    gen ratios_gen = _pca_explained_ratio(eigenvals_gen, contextptr);
    if (ratios_gen.type != _VECT) return ratios_gen;
    vecteur ratios = *ratios_gen._VECTptr;

    int p = ratios.size();
    double cumul = 0.0;
    for (int q = 0; q < p; ++q) {
        gen r = evalf(ratios[q], 1, contextptr);
        if (r.type == _DOUBLE_) cumul += r._DOUBLE_val;
        if (cumul >= seuil - 1e-10)
            return q + 1; // retourne q (1-indexé)
    }
    return p; // fallback : toutes les composantes
}
static const char _pca_select_q_s []="pca_select_q";
static define_unary_function_eval (__pca_select_q, &_pca_select_q, _pca_select_q_s);
define_unary_function_ptr5(at_pca_select_q, alias_at_pca_select_q, &__pca_select_q, 0, true);


struct CompareByVal {
  const vecteur & val;
  CompareByVal(const vecteur& v) : val(v) {}
  bool operator()(int a, int b) const {
    return val[a] > val[b];
  }
};


// Etant donné la matrice de cov Sigma, renvoie la matrice orthogonale de passage telle que Sigma = V*D*V^T où D = diag(pca_eigenvalues)
gen _pca_V(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT || !ckmatrix(*args._VECTptr)) return gensizeerr("Matrice attendue");
    vecteur val = *_eigenvals(args, contextptr)._VECTptr;
    matrice m = *_eigenvects(args, contextptr)._VECTptr;
    int p = val.size();

    std::vector<int> indices(p);
    for (int i = 0; i < p; ++i) indices[i] = i;
    std::sort(indices.begin(), indices.end(), CompareByVal(val));

    std::vector<vecteur> colonnes_normalisees(p);
    for (int j = 0; j < p; ++j) {
        vecteur col;
        for (int i = 0; i < p; ++i) {
            if (m[i].type == _VECT) {
                col.push_back((*m[i]._VECTptr)[indices[j]]);
            } else {
                col.push_back(0);
            }
        }
        gen col_norm = _normalize(col, contextptr);
        
        if (col_norm.type == _VECT) {
            vecteur cn = *col_norm._VECTptr;
            int idx_max = -1;
            double max_abs = -1.0;
            for (int k = 0; k < int(cn.size()); ++k) {
                gen vk = evalf(cn[k], 1, contextptr);
                if (vk.type == _DOUBLE_) {
                    double a = std::abs(vk._DOUBLE_val);
                    if (a > max_abs) { max_abs = a; idx_max = k; }
                }
            }
            if (idx_max >= 0) {
                gen vmax = evalf(cn[idx_max], 1, contextptr);
                if (vmax.type == _DOUBLE_ && vmax._DOUBLE_val < 0)
                    col_norm = -col_norm;
            }
        }
        if (col_norm.type == _VECT) {
            colonnes_normalisees[j] = *col_norm._VECTptr;
        } else {
            colonnes_normalisees[j] = col; 
        }
    }

    matrice V;
    for (int i = 0; i < p; ++i) {
        vecteur ligne;
        for (int j = 0; j < p; ++j) {
            ligne.push_back(colonnes_normalisees[j][i]);
        }
        V.push_back(ligne);
    }

    return V;
}
static const char _pca_V_s []="pca_V";
static define_unary_function_eval (__pca_V, &_pca_V, _pca_V_s);
define_unary_function_ptr5(at_pca_V, alias_at_pca_V, &__pca_V, 0, true);



// Etant donné la matrice de cov et un entier q qui designe le nombre de composants pricipaux (PCs), revoie la matrice W (taille p x q) qui contient les q premières colonnes de V
gen _pca_loadings(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    
    gen matrix_arg;
    int q = 0;
    
    if (args.type == _VECT && args._VECTptr->size() == 2 && (*args._VECTptr)[0].type == _VECT && (*args._VECTptr)[1].type != _VECT) {
        matrix_arg = (*args._VECTptr)[0];
        gen gq = (*args._VECTptr)[1];
        if (gq.type == _INT_ || gq.type == _ZINT) q = gq.val;
        else return gensizeerr("Le second argument doit être un entier (q)");
    } else if (args.type == _VECT) {
        matrix_arg = args;
        q = args._VECTptr->size(); // Par défaut, q = p
    } else {
        return gensizeerr("Matrice de covariance attendue");
    }

    if (matrix_arg.type != _VECT || !ckmatrix(*matrix_arg._VECTptr))
        return gensizeerr("Matrice de covariance attendue");
    
    gen V_gen = _pca_V(matrix_arg, contextptr);
    if (V_gen.type != _VECT) return V_gen;
    
    matrice V = *V_gen._VECTptr;
    int p = V.size();
    
    if (q < 1 || q > p) {
        return gensizeerr("Le nombre de composantes q doit être compris entre 1 et p");
    }

    matrice W;
    for (int i = 0; i < p; ++i) {
        vecteur ligne;
        for (int j = 0; j < q; ++j) {
            if (V[i].type == _VECT) {
                ligne.push_back((*V[i]._VECTptr)[j]);
            } else {
                ligne.push_back(0);
            }
        }
        W.push_back(ligne);
    }
    
    return W;
}
static const char _pca_loadings_s []="pca_loadings";
static define_unary_function_eval (__pca_loadings, &_pca_loadings, _pca_loadings_s);
define_unary_function_ptr5(at_pca_loadings, alias_at_pca_loadings, &__pca_loadings, 0, true);



// Etant donné une matrice de données X (taille n x p) et un entier q<=p (nombre de CP), retourne la matrice des scores Z (taille n x q) tq Z = XW
gen _pca_scores(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    
    if (args.type != _VECT || args._VECTptr->size() != 2) {
        return gensizeerr("Deux arguments attendus sous la forme : [X, q]");
    }
    
    gen gX = (*args._VECTptr)[0];
    gen gq = (*args._VECTptr)[1];
    
    if (gX.type != _VECT) {
        return gensizeerr("Le premier argument doit être une matrice de données (X)");
    }
    
    gen Sigma = _cov_matrix(gX, contextptr);
    if (Sigma.type == _STRNG && Sigma.subtype == -1) return Sigma; 
    
    vecteur args_loadings_v;
    args_loadings_v.push_back(Sigma);
    args_loadings_v.push_back(gq);
    gen args_loadings(args_loadings_v, _VECT);
    
    gen gW = _pca_loadings(args_loadings, contextptr);
    if (gW.type == _STRNG && gW.subtype == -1) return gW;
    if (gW.type != _VECT) return gW;
    
    vecteur X = *gX._VECTptr;    
    int n = X.size(); 
    if (n == 0) return matrice();
    int p = X[0]._VECTptr->size();

    vecteur moyennes; 
    for (int j = 0; j < p; ++j) {
        gen somme = 0;
        for (int i = 0; i < n; ++i) {
            somme = somme + (*X[i]._VECTptr)[j];
        }
        moyennes.push_back(somme / n);
    }

    matrice X_centree; 
    for (int i = 0; i < n; ++i) {
        vecteur ligne_centree; 
        for (int j = 0; j < p; ++j) {
            ligne_centree.push_back((*X[i]._VECTptr)[j] - moyennes[j]);
        }
        X_centree.push_back(ligne_centree); 
    }
    return gen(X_centree, _VECT) * gW;
}
static const char _pca_scores_s []="pca_scores";
static define_unary_function_eval (__pca_scores, &_pca_scores, _pca_scores_s);
define_unary_function_ptr5(at_pca_scores, alias_at_pca_scores, &__pca_scores, 0, true);


// Fonction façade : étant donné une matrice de données X (n×p) et un seuil de variance
// expliquée (entre 0 et 1), sélectionne automatiquement q via pca_select_q puis
// retourne [Z, q, cumul] où Z est la matrice des scores (n×q), q le nombre de
// composantes retenues, et cumul le vecteur des ratios de variance cumulée.
gen _pca(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;

    if (args.type != _VECT || args._VECTptr->size() != 2)
        return gensizeerr("Deux arguments attendus : [X, seuil]");

    gen gX     = (*args._VECTptr)[0];
    gen gseuil = (*args._VECTptr)[1];

    if (gX.type != _VECT || !ckmatrix(*gX._VECTptr))
        return gensizeerr("Le premier argument doit être une matrice de données (X)");

    gen gSigma = _cov_matrix(gX, contextptr);
    if (gSigma.type == _STRNG && gSigma.subtype == -1) return gSigma;

    vecteur args_sq;
    args_sq.push_back(gSigma);
    args_sq.push_back(gseuil);
    gen gq = _pca_select_q(gen(args_sq, _VECT), contextptr);
    if (gq.type == _STRNG && gq.subtype == -1) return gq;

    vecteur args_sc;
    args_sc.push_back(gX);
    args_sc.push_back(gq);
    gen gZ = _pca_scores(gen(args_sc, _VECT), contextptr);
    if (gZ.type == _STRNG && gZ.subtype == -1) return gZ;

    gen eigenvals_gen = _pca_eigenvalues(gSigma, contextptr);
    if (eigenvals_gen.type != _VECT) return eigenvals_gen;
    gen ratios_gen = _pca_explained_ratio(eigenvals_gen, contextptr);
    if (ratios_gen.type != _VECT) return ratios_gen;
    vecteur ratios = *ratios_gen._VECTptr;
    int p = ratios.size();
    vecteur cumul;
    double c = 0.0;
    for (int i = 0; i < p; ++i) {
        gen r = evalf(ratios[i], 1, contextptr);
        if (r.type == _DOUBLE_) c += r._DOUBLE_val;
        cumul.push_back(c);
    }

    vecteur resultat;
    resultat.push_back(gZ);
    resultat.push_back(gq);
    resultat.push_back(cumul);
    return gen(resultat, _VECT);
}
static const char _pca_s []="pca";
static define_unary_function_eval (__pca, &_pca, _pca_s);
define_unary_function_ptr5(at_pca, alias_at_pca, &__pca, 0, true);


// MULTIPLE LINEAR REGRESSION (MLR)

// Fonctions auxiliaires MLR

// Vérifie les arguments [X, y] ou [X, y, use_qr] et extrait n, p, use_qr
static bool mlr_check(const gen & args, gen & gX, gen & gy,
                       int & n, int & p, bool & use_qr, gen & err, GIAC_CONTEXT){
    if (args.type != _VECT) {
        err = gensizeerr("Arguments attendus : [X, y] ou [X, y, 1]"); return false;
    }
    int sz = args._VECTptr->size();
    if (sz < 2 || sz > 3) {
        err = gensizeerr("Arguments attendus : [X, y] ou [X, y, 1]"); return false;
    }
    gX = evalf((*args._VECTptr)[0], 1, contextptr);
    gy = evalf((*args._VECTptr)[1], 1, contextptr);
    use_qr = false;
    if (sz == 3) {
        gen gqr = (*args._VECTptr)[2];
        if (gqr.type == _INT_) use_qr = (gqr.val == 1);
    }
    if (gX.type != _VECT || !ckmatrix(*gX._VECTptr)){
        err = gensizeerr("Le premier argument doit être une matrice X (n x p)"); return false;
    }
    if (gy.type != _VECT){
        err = gensizeerr("Le second argument doit être un vecteur y (n x 1)"); return false;
    }
    n = gX._VECTptr->size();
    p = (*(*gX._VECTptr)[0]._VECTptr).size();
    if ((int)gy._VECTptr->size() != n){
        err = gensizeerr("X et y doivent avoir le même nombre de lignes"); return false;
    }
    if (n <= p + 1){
        err = gensizeerr("Pas assez d'observations : il faut n > p+1"); return false;
    }
    return true;
}

// construit la matrice X_aug (colonne de 1 + X)
static gen mlr_augment(const gen & gX, int n, int p){
    matrice X_aug;
    vecteur X = *gX._VECTptr;
    for (int i = 0; i < n; ++i){
        vecteur ligne;
        ligne.push_back(1);
        vecteur xi = *X[i]._VECTptr;
        for (int j = 0; j < p; ++j) ligne.push_back(xi[j]);
        X_aug.push_back(ligne);
    }
    return gen(X_aug, _VECT);
}

// Calcule beta_hat via méthode directe ou QR selon use_qr
static gen mlr_compute_beta(const gen & gX_aug, const gen & gy,
                             int n, int p, bool use_qr, GIAC_CONTEXT){
    if (!use_qr) {
        gen gXt  = _tran(gX_aug, contextptr);
        gen gXtX = gXt * gX_aug;
        gen gdet = evalf(_det(gXtX, contextptr), 1, contextptr);
        if (gdet.type == _DOUBLE_ && std::abs(gdet._DOUBLE_val) < 1e-10)
            return gensizeerr("La matrice tran(X)*X est singulière : les colonnes de X sont linéairement dépendantes (multicolinéarité)");
        return _inv(gXtX, contextptr) * (gXt * gy);
    } else {
        gen gXt_check = _tran(gX_aug, contextptr);
        gen gXtX_check = gXt_check * gX_aug;
        gen gdet_check = evalf(_det(gXtX_check, contextptr), 1, contextptr);
        if (gdet_check.type == _DOUBLE_ && std::abs(gdet_check._DOUBLE_val) < 1e-10)
            return gensizeerr("La matrice tran(X)*X est singulière : les colonnes de X sont linéairement dépendantes (multicolinéarité)");
        // QR réduite : X_aug = Q1 * R1
        // qr retourne Q (n x n) et R (n x (p+1)), on extrait Q1 (n x (p+1)) et R1 ((p+1) x (p+1))
        gen gqr = qr(gX_aug, contextptr);
        if (gqr.type != _VECT || gqr._VECTptr->size() < 2)
            return gensizeerr("Echec de la decomposition QR");
        matrice Q_full = *(*gqr._VECTptr)[0]._VECTptr;
        matrice R_full = *(*gqr._VECTptr)[1]._VECTptr;
        int pp1 = p + 1;

        matrice Q1;
        for (int i = 0; i < n; ++i){
            vecteur row = *Q_full[i]._VECTptr;
            vecteur row1;
            for (int j = 0; j < pp1; ++j) row1.push_back(row[j]);
            Q1.push_back(row1);
        }
        matrice R1;
        for (int i = 0; i < pp1; ++i){
            vecteur row = *R_full[i]._VECTptr;
            vecteur row1;
            for (int j = 0; j < pp1; ++j) row1.push_back(row[j]);
            R1.push_back(row1);
        }
        gen gQ1(Q1, _VECT);
        gen gR1(R1, _VECT);
        // beta_hat = inv(R1) * tran(Q1) * y selon la formule de la régression par QR
        return _inv(gR1, contextptr) * (_tran(gQ1, contextptr) * gy);
    }
}

// calcule SS_res à partir des résidus
static double mlr_ssres(const gen & gresidus, int n, GIAC_CONTEXT){
    vecteur resid = *gresidus._VECTptr;
    double SS_res = 0.0;
    for (int i = 0; i < n; ++i){
        gen ri = evalf(resid[i], 1, contextptr);
        if (ri.type == _DOUBLE_) SS_res += ri._DOUBLE_val * ri._DOUBLE_val;
    }
    return SS_res;
}

// calcule SS_tot à partir de y
static double mlr_sstot(const gen & gy, int n, GIAC_CONTEXT){
    vecteur yv = *gy._VECTptr;
    double y_mean = 0.0;
    for (int i = 0; i < n; ++i){
        gen yi = evalf(yv[i], 1, contextptr);
        if (yi.type == _DOUBLE_) y_mean += yi._DOUBLE_val;
    }
    y_mean /= n;
    double SS_tot = 0.0;
    for (int i = 0; i < n; ++i){
        gen yi = evalf(yv[i], 1, contextptr);
        if (yi.type == _DOUBLE_){ double d = yi._DOUBLE_val - y_mean; SS_tot += d*d; }
    }
    return SS_tot;
}

// Fonctions MLR publiques

// renvoie beta_hat selon use_qr
gen _mlr_beta(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    gen gX, gy, err; int n, p; bool use_qr;
    if (!mlr_check(args, gX, gy, n, p, use_qr, err, contextptr)) return err;
    gen gX_aug = mlr_augment(gX, n, p);
    return mlr_compute_beta(gX_aug, gy, n, p, use_qr, contextptr);
}
static const char _mlr_beta_s []="mlr_beta";
static define_unary_function_eval (__mlr_beta, &_mlr_beta, _mlr_beta_s);
define_unary_function_ptr5(at_mlr_beta, alias_at_mlr_beta, &__mlr_beta, 0, true);


// renvoie les valeurs prédites y_hat = X_aug · beta_hat
gen _mlr_predict(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT || args._VECTptr->size() != 2)
        return gensizeerr("Deux arguments attendus : [X, beta]");
    gen gX    = evalf((*args._VECTptr)[0], 1, contextptr);
    gen gbeta = evalf((*args._VECTptr)[1], 1, contextptr);
    if (gX.type != _VECT || !ckmatrix(*gX._VECTptr))
        return gensizeerr("Le premier argument doit être une matrice X (n x p)");
    if (gbeta.type != _VECT)
        return gensizeerr("Le second argument doit être le vecteur beta");
    int n = gX._VECTptr->size();
    int p = (*(*gX._VECTptr)[0]._VECTptr).size();
    gen gX_aug = mlr_augment(gX, n, p);
    return gX_aug * gbeta;
}
static const char _mlr_predict_s []="mlr_predict";
static define_unary_function_eval (__mlr_predict, &_mlr_predict, _mlr_predict_s);
define_unary_function_ptr5(at_mlr_predict, alias_at_mlr_predict, &__mlr_predict, 0, true);


//  les résidus e = y - y_hat
gen _mlr_residuals(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    gen gX, gy, err; int n, p; bool use_qr;
    if (!mlr_check(args, gX, gy, n, p, use_qr, err, contextptr)) return err;
    gen gX_aug = mlr_augment(gX, n, p);
    gen gbeta  = mlr_compute_beta(gX_aug, gy, n, p, use_qr, contextptr);
    if (gbeta.type == _STRNG) return gbeta;
    return gy - gX_aug * gbeta;
}
static const char _mlr_residuals_s []="mlr_residuals";
static define_unary_function_eval (__mlr_residuals, &_mlr_residuals, _mlr_residuals_s);
define_unary_function_ptr5(at_mlr_residuals, alias_at_mlr_residuals, &__mlr_residuals, 0, true);


//  R2 = 1 - SS_res/SS_tot
gen _mlr_r2(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    gen gX, gy, err; int n, p; bool use_qr;
    if (!mlr_check(args, gX, gy, n, p, use_qr, err, contextptr)) return err;
    gen gX_aug   = mlr_augment(gX, n, p);
    gen gbeta    = mlr_compute_beta(gX_aug, gy, n, p, use_qr, contextptr);
    if (gbeta.type == _STRNG) return gbeta;
    gen gresidus = gy - gX_aug * gbeta;
    double SS_res = mlr_ssres(gresidus, n, contextptr);
    double SS_tot = mlr_sstot(gy, n, contextptr);
    return (SS_tot > 1e-14) ? 1.0 - SS_res / SS_tot : 0.0;
}
static const char _mlr_r2_s []="mlr_r2";
static define_unary_function_eval (__mlr_r2, &_mlr_r2, _mlr_r2_s);
define_unary_function_ptr5(at_mlr_r2, alias_at_mlr_r2, &__mlr_r2, 0, true);


//  sigma_hat2 = SS_res / (n-p-1)
gen _mlr_sigma2(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    gen gX, gy, err; int n, p; bool use_qr;
    if (!mlr_check(args, gX, gy, n, p, use_qr, err, contextptr)) return err;
    gen gX_aug   = mlr_augment(gX, n, p);
    gen gbeta    = mlr_compute_beta(gX_aug, gy, n, p, use_qr, contextptr);
    if (gbeta.type == _STRNG) return gbeta;
    gen gresidus = gy - gX_aug * gbeta;
    double SS_res = mlr_ssres(gresidus, n, contextptr);
    return SS_res / (n - p - 1);
}
static const char _mlr_sigma2_s []="mlr_sigma2";
static define_unary_function_eval (__mlr_sigma2, &_mlr_sigma2, _mlr_sigma2_s);
define_unary_function_ptr5(at_mlr_sigma2, alias_at_mlr_sigma2, &__mlr_sigma2, 0, true);


//  MSE = SS_res / n
gen _mlr_mse(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    gen gX, gy, err; int n, p; bool use_qr;
    if (!mlr_check(args, gX, gy, n, p, use_qr, err, contextptr)) return err;
    gen gX_aug   = mlr_augment(gX, n, p);
    gen gbeta    = mlr_compute_beta(gX_aug, gy, n, p, use_qr, contextptr);
    if (gbeta.type == _STRNG) return gbeta;
    gen gresidus = gy - gX_aug * gbeta;
    double SS_res = mlr_ssres(gresidus, n, contextptr);
    return SS_res / n;
}
static const char _mlr_mse_s []="mlr_mse";
static define_unary_function_eval (__mlr_mse, &_mlr_mse, _mlr_mse_s);
define_unary_function_ptr5(at_mlr_mse, alias_at_mlr_mse, &__mlr_mse, 0, true);


// Renvoie la matrice IC (p+1)×2 des intervalles de confiance à 95%
// sur chaque beta_i via la loi de Student(n-p-1)
// Pour les IC, on a besoin de inv(tran(X)*X) pour se(beta_i)
// En mode QR : inv(tran(X)*X) = inv(tran(R)*R)
gen _mlr_ic(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    gen gX, gy, err; int n, p; bool use_qr;
    if (!mlr_check(args, gX, gy, n, p, use_qr, err, contextptr)) return err;

    gen gX_aug = mlr_augment(gX, n, p);
    gen gbeta  = mlr_compute_beta(gX_aug, gy, n, p, use_qr, contextptr);
    if (gbeta.type == _STRNG) return gbeta;

    gen gresidus = gy - gX_aug * gbeta;
    double SS_res = mlr_ssres(gresidus, n, contextptr);
    double sigma  = std::sqrt(SS_res / (n - p - 1));

    gen gXtXinv;
    if (!use_qr) {
        gen gXt  = _tran(gX_aug, contextptr);
        gXtXinv  = _inv(gXt * gX_aug, contextptr);
    } else {
        gen gqr  = qr(gX_aug, contextptr);
        matrice R_full = *(*gqr._VECTptr)[1]._VECTptr;
        int pp1 = p + 1;
        matrice R1;
        for (int i = 0; i < pp1; ++i){
            vecteur row = *R_full[i]._VECTptr;
            vecteur row1;
            for (int j = 0; j < pp1; ++j) row1.push_back(row[j]);
            R1.push_back(row1);
        }
        gen gR1(R1, _VECT);
        gen gRt  = _tran(gR1, contextptr);
        gXtXinv  = _inv(gRt * gR1, contextptr); // inv(tran(R1)*R1) = inv(tran(X)*X)
    }

    gen t_quant = evalf(_student_icdf(
        gen(makevecteur(gen(n-p-1), gen(0.975)), _SEQ__VECT), contextptr), 1, contextptr);
    double t_val = (t_quant.type == _DOUBLE_) ? t_quant._DOUBLE_val : 1.96;

    matrice XtXinv_mat = *gXtXinv._VECTptr;
    vecteur beta_v     = *gbeta._VECTptr;
    matrice IC;
    for (int i = 0; i <= p; ++i){
        gen diag_i = evalf((*XtXinv_mat[i]._VECTptr)[i], 1, contextptr);
        double se_i = (diag_i.type == _DOUBLE_) ? sigma * std::sqrt(diag_i._DOUBLE_val) : 0.0;
        gen bi = evalf(beta_v[i], 1, contextptr);
        double b = (bi.type == _DOUBLE_) ? bi._DOUBLE_val : 0.0;
        IC.push_back(makevecteur(b - t_val * se_i, b + t_val * se_i));
    }
    return gen(IC, _VECT);
}
static const char _mlr_ic_s []="mlr_ic";
static define_unary_function_eval (__mlr_ic, &_mlr_ic, _mlr_ic_s);
define_unary_function_ptr5(at_mlr_ic, alias_at_mlr_ic, &__mlr_ic, 0, true);


// Façade MLR : retourne [beta_hat, y_hat, residus, R2, sigma2, mse, IC] dans un format user-friendly : une liste de paires (matrice) ["nom", valeur]
gen _mlr(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    gen gX, gy, err; int n, p; bool use_qr;
    if (!mlr_check(args, gX, gy, n, p, use_qr, err, contextptr)) return err;

    gen gX_aug   = mlr_augment(gX, n, p);
    gen gbeta    = mlr_compute_beta(gX_aug, gy, n, p, use_qr, contextptr);
    if (gbeta.type == _STRNG) return gbeta;
    gen gy_pred  = gX_aug * gbeta;
    gen gresidus = gy - gy_pred;

    double SS_res = mlr_ssres(gresidus, n, contextptr);
    double SS_tot = mlr_sstot(gy, n, contextptr);
    double R2     = (SS_tot > 1e-14) ? 1.0 - SS_res / SS_tot : 0.0;
    double sigma2 = SS_res / (n - p - 1);
    double mse    = SS_res / n;

    gen gXtXinv;
    if (!use_qr) {
        gen gXt = _tran(gX_aug, contextptr);
        gXtXinv = _inv(gXt * gX_aug, contextptr);
    } else {
        gen gqr = qr(gX_aug, contextptr);
        matrice R_full = *(*gqr._VECTptr)[1]._VECTptr;
        int pp1 = p + 1;
        matrice R1;
        for (int i = 0; i < pp1; ++i){
            vecteur row = *R_full[i]._VECTptr;
            vecteur row1;
            for (int j = 0; j < pp1; ++j) row1.push_back(row[j]);
            R1.push_back(row1);
        }
        gen gR1(R1, _VECT);
        gXtXinv = _inv(_tran(gR1, contextptr) * gR1, contextptr);
    }
    double sigma = std::sqrt(sigma2);
    gen t_quant  = evalf(_student_icdf(
        gen(makevecteur(gen(n-p-1), gen(0.975)), _SEQ__VECT), contextptr), 1, contextptr);
    double t_val = (t_quant.type == _DOUBLE_) ? t_quant._DOUBLE_val : 1.96;
    matrice XtXinv_mat = *gXtXinv._VECTptr;
    vecteur beta_v     = *gbeta._VECTptr;
    matrice IC;
    for (int i = 0; i <= p; ++i){
        gen diag_i = evalf((*XtXinv_mat[i]._VECTptr)[i], 1, contextptr);
        double se_i = (diag_i.type == _DOUBLE_) ? sigma * std::sqrt(diag_i._DOUBLE_val) : 0.0;
        gen bi = evalf(beta_v[i], 1, contextptr);
        double b = (bi.type == _DOUBLE_) ? bi._DOUBLE_val : 0.0;
        IC.push_back(makevecteur(b - t_val * se_i, b + t_val * se_i));
    }

    vecteur resultat;

    for (int i = 0; i <= p; ++i){
      std::string nom = "beta_" + print_INT_(i);
        resultat.push_back(makevecteur(string2gen(nom, false), beta_v[i]));
    }

    resultat.push_back(makevecteur(string2gen("y_pred", false),  gy_pred));
    resultat.push_back(makevecteur(string2gen("residus", false), gresidus));

    resultat.push_back(makevecteur(string2gen("R2",     false), R2));
    resultat.push_back(makevecteur(string2gen("sigma2", false), sigma2));
    resultat.push_back(makevecteur(string2gen("mse",    false), mse));

    for (int i = 0; i <= p; ++i){
      std::string nom = "IC_beta_" + print_INT_(i);
        resultat.push_back(makevecteur(string2gen(nom, false), IC[i]));
    }

    return gen(resultat, _VECT);
}
static const char _mlr_s []="mlr";
static define_unary_function_eval (__mlr, &_mlr, _mlr_s);
define_unary_function_ptr5(at_mlr, alias_at_mlr, &__mlr, 0, true);


// HELPERS: 

// lit un scalaire réel (_DOUBLE_ ou _INT_)
static bool sim_todouble(const gen & g, double & out){
    if (g.type == _DOUBLE_){ out = g._DOUBLE_val; return true; }
    if (g.type == _INT_){ out = double(g.val); return true; }
    return false;
}
 
// lit un entier strictement positif
static bool sim_posint(const gen & g, int & out){
    if (g.type == _INT_ && g.val >= 1){ out = g.val; return true; }
    return false;
}
 
// 1 -> vecteur plat, m>1 -> matrice m x (n+1)
static gen sim_pack(const matrice & paths, int m){
    if (m == 1) return paths[0];
    return gen(paths, _VECT);
}
 
// Tire n incréments N(0,1)
static vecteur sim_normals(int n, GIAC_CONTEXT){
    gen Zg = _randvector(gen(makevecteur(gen(n), gen(*at_normald), gen(0), gen(1)), _SEQ__VECT), contextptr);
    return *Zg._VECTptr;
}

// FIN DES HELPERS
 
//  brownian(T, n) [, m]
// Mouvement Brownien standard sur [0,T] à n pas. Renvoie [W_0,...,W_n] avec W_0 = 0
// ou une matrice m x (n+1) si m>1
gen _brownian(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [T, n] ou [T, n, m]");
    vecteur v = *args._VECTptr;
    int sz = int(v.size());
    if (sz < 2 || sz > 3) return gensizeerr("Arguments attendus : [T, n] ou [T, n, m]");
    double T;
    if (!sim_todouble(evalf(v[0], 1, contextptr), T) || T <= 0)
        return gensizeerr("T doit être un réel strictement positif");
    int n; if (!sim_posint(v[1], n)) return gensizeerr("n doit être un entier strictement positif");
    int m = 1;
    if (sz == 3 && !sim_posint(v[2], m)) return gensizeerr("m doit être un entier strictement positif");
    double dt = T / n, sdt = std::sqrt(dt);
    matrice paths;
    for (int k = 0; k < m; ++k){
        vecteur Z = sim_normals(n, contextptr);
        vecteur W; W.reserve(n+1);
        double w = 0.0; W.push_back(0.0);
        for (int i = 0; i < n; ++i){
            double z; if (!sim_todouble(Z[i], z)) z = 0.0;
            w += sdt * z; W.push_back(w);
        }
        paths.push_back(gen(W, _VECT));
    }
    return sim_pack(paths, m);
}
static const char _brownian_s []="brownian";
static define_unary_function_eval (__brownian, &_brownian, _brownian_s);
define_unary_function_ptr5(at_brownian, alias_at_brownian, &__brownian, 0, true);
 
// gbm(s0, mu, sigma, T, n) [, m]
// Mouvement Brownien géométrique : dS = mu*S dt + sigma*S dW.
// Solution exacte (log-normal) : S_{k+1}=S_k*exp((mu-sigma^2/2)dt + sigma*sqrt(dt)*Z).
gen _gbm(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [s0, mu, sigma, T, n] [, m]");
    vecteur v = *args._VECTptr;
    int sz = int(v.size());
    if (sz < 5 || sz > 6) return gensizeerr("Arguments attendus : [s0, mu, sigma, T, n] [, m]");
    double s0, mu, sigma, T;
    if (!sim_todouble(evalf(v[0], 1, contextptr), s0) || s0 <= 0)
        return gensizeerr("s0 doit être un réel strictement positif");
    if (!sim_todouble(evalf(v[1], 1, contextptr), mu))
        return gensizeerr("mu doit être un réel");
    if (!sim_todouble(evalf(v[2], 1, contextptr), sigma) || sigma < 0)
        return gensizeerr("sigma doit être un réel positif ou nul");
    if (!sim_todouble(evalf(v[3], 1, contextptr), T) || T <= 0)
        return gensizeerr("T doit être un réel strictement positif");
    int n; if (!sim_posint(v[4], n)) return gensizeerr("n doit être un entier strictement positif");
    int m = 1;
    if (sz == 6 && !sim_posint(v[5], m)) return gensizeerr("m doit être un entier strictement positif");
    double dt = T / n, sdt = std::sqrt(dt);
    double drift = (mu - 0.5*sigma*sigma) * dt;
    matrice paths;
    for (int k = 0; k < m; ++k){
        vecteur Z = sim_normals(n, contextptr);
        vecteur S; S.reserve(n+1);
        double s = s0; S.push_back(s);
        for (int i = 0; i < n; ++i){
            double z; if (!sim_todouble(Z[i], z)) z = 0.0;
            s = s * std::exp(drift + sigma * sdt * z);
            S.push_back(s);
        }
        paths.push_back(gen(S, _VECT));
    }
    return sim_pack(paths, m);
}
static const char _gbm_s []="gbm";
static define_unary_function_eval (__gbm, &_gbm, _gbm_s);
define_unary_function_ptr5(at_gbm, alias_at_gbm, &__gbm, 0, true);
 
// ornstein_uhlenbeck(x0, alpha, theta, sigma, T, n) [, m]
// dX = alpha*(theta - X) dt + sigma dW  (modèle de Vasicek).
// theta=0 redonne l'OU du cours (dR = -alpha*R dt + sigma dB).
// Solution  exacte:
//   X_{k+1}=theta+(X_k-theta)*e^{-alpha*dt}+sigma*sqrt((1-e^{-2 alpha dt})/(2 alpha))*Z.
gen _ornstein_uhlenbeck(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [x0, alpha, theta, sigma, T, n] [, m]");
    vecteur v = *args._VECTptr;
    int sz = int(v.size());
    if (sz < 6 || sz > 7) return gensizeerr("Arguments attendus : [x0, alpha, theta, sigma, T, n] [, m]");
    double x0, alpha, theta, sigma, T;
    if (!sim_todouble(evalf(v[0], 1, contextptr), x0))
        return gensizeerr("x0 doit être un réel");
    if (!sim_todouble(evalf(v[1], 1, contextptr), alpha) || alpha <= 0)
        return gensizeerr("alpha doit être un réel strictement positif");
    if (!sim_todouble(evalf(v[2], 1, contextptr), theta))
        return gensizeerr("theta doit être un réel");
    if (!sim_todouble(evalf(v[3], 1, contextptr), sigma) || sigma < 0)
        return gensizeerr("sigma doit être un réel positif ou nul");
    if (!sim_todouble(evalf(v[4], 1, contextptr), T) || T <= 0)
        return gensizeerr("T doit être un réel strictement positif");
    int n; if (!sim_posint(v[5], n)) return gensizeerr("n doit être un entier strictement positif");
    int m = 1;
    if (sz == 7 && !sim_posint(v[6], m)) return gensizeerr("m doit être un entier strictement positif");
    double dt = T / n;
    double a = std::exp(-alpha * dt);
    double sd = sigma * std::sqrt((1.0 - std::exp(-2.0*alpha*dt)) / (2.0*alpha));
    matrice paths;
    for (int k = 0; k < m; ++k){
        vecteur Z = sim_normals(n, contextptr);
        vecteur X; X.reserve(n+1);
        double x = x0; X.push_back(x);
        for (int i = 0; i < n; ++i){
            double z; if (!sim_todouble(Z[i], z)) z = 0.0;
            x = theta + (x - theta) * a + sd * z;
            X.push_back(x);
        }
        paths.push_back(gen(X, _VECT));
    }
    return sim_pack(paths, m);
}
static const char _ornstein_uhlenbeck_s []="ornstein_uhlenbeck";
static define_unary_function_eval (__ornstein_uhlenbeck, &_ornstein_uhlenbeck, _ornstein_uhlenbeck_s);
define_unary_function_ptr5(at_ornstein_uhlenbeck, alias_at_ornstein_uhlenbeck, &__ornstein_uhlenbeck, 0, true);
 
// cir(x0, a, b, sigma, T, n) [, m]
// Cox-Ingersoll-Ross : dR = a*(b - R) dt + sigma*sqrt(R) dW.
// a : vitesse de retour, b : niveau de retour à la moyenne.
// Pas de formule exacte simple, on utilise Euler-Maruyama
gen _cir(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [x0, a, b, sigma, T, n] [, m]");
    vecteur v = *args._VECTptr;
    int sz = int(v.size());
    if (sz < 6 || sz > 7) return gensizeerr("Arguments attendus : [x0, a, b, sigma, T, n] [, m]");
    double x0, a, b, sigma, T;
    if (!sim_todouble(evalf(v[0], 1, contextptr), x0) || x0 < 0)
        return gensizeerr("x0 doit être un réel positif ou nul");
    if (!sim_todouble(evalf(v[1], 1, contextptr), a) ||
        !sim_todouble(evalf(v[2], 1, contextptr), b))
        return gensizeerr("a, b doivent être des réels");
    if (!sim_todouble(evalf(v[3], 1, contextptr), sigma) || sigma < 0)
        return gensizeerr("sigma doit être un réel positif ou nul");
    if (!sim_todouble(evalf(v[4], 1, contextptr), T) || T <= 0)
        return gensizeerr("T doit être un réel strictement positif");
    int n; if (!sim_posint(v[5], n)) return gensizeerr("n doit être un entier strictement positif");
    int m = 1;
    if (sz == 7 && !sim_posint(v[6], m)) return gensizeerr("m doit être un entier strictement positif");
    double dt = T / n, sdt = std::sqrt(dt);
    matrice paths;
    for (int k = 0; k < m; ++k){
        vecteur Z = sim_normals(n, contextptr);
        vecteur R; R.reserve(n+1);
        double r = x0; R.push_back(r);
        for (int i = 0; i < n; ++i){
            double z; if (!sim_todouble(Z[i], z)) z = 0.0;
            double rp = (r > 0.0) ? r : 0.0; // troncature sous la racine
            r = r + a*(b - r)*dt + sigma*std::sqrt(rp)*sdt*z;
            R.push_back(r);
        }
        paths.push_back(gen(R, _VECT));
    }
    return sim_pack(paths, m);
}
static const char _cir_s []="cir";
static define_unary_function_eval (__cir, &_cir, _cir_s);
define_unary_function_ptr5(at_cir, alias_at_cir, &__cir, 0, true);
 

 
// sde_euler(b, sigma, x0, T, n) [, m]
// Euler-Maruyama générique pour dX = b(t,x) dt + sigma(t,x) dW
// b et sigma sont des expressions des variables t et x
//   X_{k+1} = X_k + b(t_k,X_k)*dt + sigma(t_k,X_k)*sqrt(dt)*Z
gen _sde_euler(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [b, sigma, x0, T, n] (b,sigma : expressions en t et x) [, m]");
    vecteur v = *args._VECTptr;
    int sz = int(v.size());
    if (sz < 5 || sz > 6) return gensizeerr("Arguments attendus : [b, sigma, x0, T, n] [, m]");
    gen drift = v[0], sig = v[1];
    double x0, T;
    if (!sim_todouble(evalf(v[2], 1, contextptr), x0)) return gensizeerr("x0 doit être un réel");
    if (!sim_todouble(evalf(v[3], 1, contextptr), T) || T <= 0)
        return gensizeerr("T doit être un réel strictement positif");
    int n; if (!sim_posint(v[4], n)) return gensizeerr("n doit être un entier strictement positif");
    int m = 1;
    if (sz == 6 && !sim_posint(v[5], m)) return gensizeerr("m doit être un entier strictement positif");
    gen vt = identificateur("t");
    gen vx = identificateur("x");
    gen subl = makevecteur(vt, vx);
    double dt = T / n, sdt = std::sqrt(dt);
    matrice paths;
    for (int k = 0; k < m; ++k){
        vecteur Z = sim_normals(n, contextptr);
        vecteur X; X.reserve(n+1);
        double xk = x0; X.push_back(xk);
        for (int i = 0; i < n; ++i){
            double tk = i * dt;
            gen valv = makevecteur(tk, xk);
            double bb, ss, z;
            if (!sim_todouble(evalf(subst(drift, subl, valv, false, contextptr), 1, contextptr), bb)) bb = 0.0;
            if (!sim_todouble(evalf(subst(sig,   subl, valv, false, contextptr), 1, contextptr), ss)) ss = 0.0;
            if (!sim_todouble(Z[i], z)) z = 0.0;
            xk = xk + bb*dt + ss*sdt*z;
            X.push_back(xk);
        }
        paths.push_back(gen(X, _VECT));
    }
    return sim_pack(paths, m);
}
static const char _sde_euler_s []="sde_euler";
static define_unary_function_eval (__sde_euler, &_sde_euler, _sde_euler_s);
define_unary_function_ptr5(at_sde_euler, alias_at_sde_euler, &__sde_euler, 0, true);
 
// sde_milstein(b, sigma, x0, T, n) [, m]
// Milstein pour dX = b(t,x) dt + sigma(t,x) dW
// X_{k+1} = X_k + b(t_k,X_k)*dt + sigma(t_k,X_k)*sqrt(dt)*Z + 1/2 * sigma(t_k,X_k) * d sigma / d x (t_k,X_k) * (dW^2 - dt)
gen _sde_milstein(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [b, sigma, x0, T, n] (b,sigma : expressions en t et x) [, m]");
    vecteur v = *args._VECTptr;
    int sz = int(v.size());
    if (sz < 5 || sz > 6) return gensizeerr("Arguments attendus : [b, sigma, x0, T, n] [, m]");
    gen drift = v[0], sig = v[1];
    double x0, T;
    if (!sim_todouble(evalf(v[2], 1, contextptr), x0)) return gensizeerr("x0 doit être un réel");
    if (!sim_todouble(evalf(v[3], 1, contextptr), T) || T <= 0)
        return gensizeerr("T doit être un réel strictement positif");
    int n; if (!sim_posint(v[4], n)) return gensizeerr("n doit être un entier strictement positif");
    int m = 1;
    if (sz == 6 && !sim_posint(v[5], m)) return gensizeerr("m doit être un entier strictement positif");
    gen vt = identificateur("t");
    gen vx = identificateur("x");
    gen subl = makevecteur(vt, vx);
    gen sigx = _derive(gen(makevecteur(sig, vx), _SEQ__VECT), contextptr); // d sigma / d x (symbolique)
    double dt = T / n, sdt = std::sqrt(dt);
    matrice paths;
    for (int k = 0; k < m; ++k){
        vecteur Z = sim_normals(n, contextptr);
        vecteur X; X.reserve(n+1);
        double xk = x0; X.push_back(xk);
        for (int i = 0; i < n; ++i){
            double tk = i * dt;
            gen valv = makevecteur(tk, xk);
            double bb, ss, sx, z;
            if (!sim_todouble(evalf(subst(drift, subl, valv, false, contextptr), 1, contextptr), bb)) bb = 0.0;
            if (!sim_todouble(evalf(subst(sig,   subl, valv, false, contextptr), 1, contextptr), ss)) ss = 0.0;
            if (!sim_todouble(evalf(subst(sigx,  subl, valv, false, contextptr), 1, contextptr), sx)) sx = 0.0;
            if (!sim_todouble(Z[i], z)) z = 0.0;
            double dW = sdt * z;
            xk = xk + bb*dt + ss*dW + 0.5*ss*sx*(dW*dW - dt);
            X.push_back(xk);
        }
        paths.push_back(gen(X, _VECT));
    }
    return sim_pack(paths, m);
}
static const char _sde_milstein_s []="sde_milstein";
static define_unary_function_eval (__sde_milstein, &_sde_milstein, _sde_milstein_s);
define_unary_function_ptr5(at_sde_milstein, alias_at_sde_milstein, &__sde_milstein, 0, true);


//  BLOC Black-Scholes (prix, Greeks, volatilité implicite)

enum bs_quantity { BS_PRICE, BS_DELTA, BS_GAMMA, BS_VEGA, BS_THETA, BS_RHO };

// FDR normale standard via erf : N(x) = (1 + erf(x/sqrt(2)))/2.
static gen bs_Ncdf(const gen & x){
    return (gen(1) + symbolic(at_erf, x / symbolic(at_sqrt, gen(2)))) / gen(2);
}

//  prix Black-Scholes
static gen bs_price_expr(const gen & S, const gen & K, const gen & r,
                         const gen & sg, const gen & T, bool is_call){
    gen sqrtT = symbolic(at_sqrt, T);
    gen d1 = (symbolic(at_ln, S / K) + (r + sg*sg/gen(2)) * T) / (sg * sqrtT);
    gen d2 = d1 - sg * sqrtT;
    gen disc = symbolic(at_exp, -r * T);
    if (is_call)
        return S * bs_Ncdf(d1) - K * disc * bs_Ncdf(d2);
    return K * disc * bs_Ncdf(-d2) - S * bs_Ncdf(-d1);
}

// Dérivée symbolique de e par rapport à x
static gen bs_derive1(const gen & e, const gen & x, GIAC_CONTEXT){
    return _derive(gen(makevecteur(e, x), _SEQ__VECT), contextptr);
}

// calcule prix ou un Greek par dérivation symbolique du prix puis évaluation
static gen bs_compute(int which, double S, double K, double r, double sg, double T,
                      bool is_call, GIAC_CONTEXT){
    gen S_id = identificateur("bs_S"), K_id = identificateur("bs_K"),
        r_id = identificateur("bs_r"), sg_id = identificateur("bs_sg"),
        T_id = identificateur("bs_T");
    gen P = bs_price_expr(S_id, K_id, r_id, sg_id, T_id, is_call);
    gen g;
    if (which == BS_PRICE)      g = P;
    else if (which == BS_DELTA) g = bs_derive1(P, S_id, contextptr);
    else if (which == BS_GAMMA) g = bs_derive1(bs_derive1(P, S_id, contextptr), S_id, contextptr);
    else if (which == BS_VEGA)  g = bs_derive1(P, sg_id, contextptr);
    else if (which == BS_THETA) g = -bs_derive1(P, T_id, contextptr); // theta = -dPrix/dT
    else                        g = bs_derive1(P, r_id, contextptr);  // BS_RHO
    gen vars = makevecteur(S_id, K_id, r_id, sg_id, T_id);
    gen vals = makevecteur(S, K, r, sg, T);
    return evalf(subst(g, vars, vals, false, contextptr), 1, contextptr);
}

// fonction de verification et lecture des arguments pour les fonctions
static bool bs_parse(const vecteur & v, double & S, double & K, double & r,
                     double & sg, double & T, bool & is_call, gen & err,
                     GIAC_CONTEXT){
    int sz = int(v.size());
    if (sz < 5 || sz > 6){ err = gensizeerr("Arguments attendus : [S, K, r, sigma, T] [, \"call\"|\"put\"]"); return false; }
    if (!sim_todouble(evalf(v[0],1,contextptr), S) || S <= 0){ err = gensizeerr("S doit être un réel strictement positif"); return false; }
    if (!sim_todouble(evalf(v[1],1,contextptr), K) || K <= 0){ err = gensizeerr("K doit être un réel strictement positif"); return false; }
    if (!sim_todouble(evalf(v[2],1,contextptr), r)){ err = gensizeerr("r doit être un réel"); return false; }
    if (!sim_todouble(evalf(v[3],1,contextptr), sg) || sg <= 0){ err = gensizeerr("sigma doit être un réel strictement positif"); return false; }
    if (!sim_todouble(evalf(v[4],1,contextptr), T) || T <= 0){ err = gensizeerr("T doit être un réel strictement positif"); return false; }
    is_call = true;
    if (sz == 6){
        if (v[5].type != _STRNG){ err = gensizeerr("Le type doit être \"call\" ou \"put\""); return false; }
        string s = *v[5]._STRNGptr;
        if (s == "call" || s == "Call" || s == "CALL") is_call = true;
        else if (s == "put" || s == "Put" || s == "PUT") is_call = false;
        else { err = gensizeerr("Le type doit être \"call\" ou \"put\""); return false; }
    }
    return true;
}

// bs_price(S, K, r, sigma, T [, type])
gen _bs_price(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [S, K, r, sigma, T] [, \"call\"|\"put\"]");
    double S,K,r,sg,T; bool is_call; gen err;
    if (!bs_parse(*args._VECTptr, S,K,r,sg,T,is_call,err,contextptr)) return err;
    return bs_compute(BS_PRICE, S,K,r,sg,T, is_call, contextptr);
}
static const char _bs_price_s []="bs_price";
static define_unary_function_eval (__bs_price, &_bs_price, _bs_price_s);
define_unary_function_ptr5(at_bs_price, alias_at_bs_price, &__bs_price, 0, true);

// bs_delta(S, K, r, sigma, T [, type])
gen _bs_delta(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [S, K, r, sigma, T] [, \"call\"|\"put\"]");
    double S,K,r,sg,T; bool is_call; gen err;
    if (!bs_parse(*args._VECTptr, S,K,r,sg,T,is_call,err,contextptr)) return err;
    return bs_compute(BS_DELTA, S,K,r,sg,T, is_call, contextptr);
}
static const char _bs_delta_s []="bs_delta";
static define_unary_function_eval (__bs_delta, &_bs_delta, _bs_delta_s);
define_unary_function_ptr5(at_bs_delta, alias_at_bs_delta, &__bs_delta, 0, true);

// bs_gamma(S, K, r, sigma, T [, type])
gen _bs_gamma(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [S, K, r, sigma, T] [, \"call\"|\"put\"]");
    double S,K,r,sg,T; bool is_call; gen err;
    if (!bs_parse(*args._VECTptr, S,K,r,sg,T,is_call,err,contextptr)) return err;
    return bs_compute(BS_GAMMA, S,K,r,sg,T, is_call, contextptr);
}
static const char _bs_gamma_s []="bs_gamma";
static define_unary_function_eval (__bs_gamma, &_bs_gamma, _bs_gamma_s);
define_unary_function_ptr5(at_bs_gamma, alias_at_bs_gamma, &__bs_gamma, 0, true);

// bs_vega(S, K, r, sigma, T [, type])
gen _bs_vega(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [S, K, r, sigma, T] [, \"call\"|\"put\"]");
    double S,K,r,sg,T; bool is_call; gen err;
    if (!bs_parse(*args._VECTptr, S,K,r,sg,T,is_call,err,contextptr)) return err;
    return bs_compute(BS_VEGA, S,K,r,sg,T, is_call, contextptr);
}
static const char _bs_vega_s []="bs_vega";
static define_unary_function_eval (__bs_vega, &_bs_vega, _bs_vega_s);
define_unary_function_ptr5(at_bs_vega, alias_at_bs_vega, &__bs_vega, 0, true);

// bs_theta(S, K, r, sigma, T [, type]) 
gen _bs_theta(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [S, K, r, sigma, T] [, \"call\"|\"put\"]");
    double S,K,r,sg,T; bool is_call; gen err;
    if (!bs_parse(*args._VECTptr, S,K,r,sg,T,is_call,err,contextptr)) return err;
    return bs_compute(BS_THETA, S,K,r,sg,T, is_call, contextptr);
}
static const char _bs_theta_s []="bs_theta";
static define_unary_function_eval (__bs_theta, &_bs_theta, _bs_theta_s);
define_unary_function_ptr5(at_bs_theta, alias_at_bs_theta, &__bs_theta, 0, true);

// bs_rho(S, K, r, sigma, T [, type]) 
gen _bs_rho(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [S, K, r, sigma, T] [, \"call\"|\"put\"]");
    double S,K,r,sg,T; bool is_call; gen err;
    if (!bs_parse(*args._VECTptr, S,K,r,sg,T,is_call,err,contextptr)) return err;
    return bs_compute(BS_RHO, S,K,r,sg,T, is_call, contextptr);
}
static const char _bs_rho_s []="bs_rho";
static define_unary_function_eval (__bs_rho, &_bs_rho, _bs_rho_s);
define_unary_function_ptr5(at_bs_rho, alias_at_bs_rho, &__bs_rho, 0, true);

// bs_greeks(S, K, r, sigma, T [, type]) 
// fonction façade : renvoie une table ["nom", valeur] (prix + 5 Greeks).
gen _bs_greeks(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [S, K, r, sigma, T] [, \"call\"|\"put\"]");
    double S,K,r,sg,T; bool is_call; gen err;
    if (!bs_parse(*args._VECTptr, S,K,r,sg,T,is_call,err,contextptr)) return err;
    vecteur res;
    res.push_back(makevecteur(string2gen("prix",  false), bs_compute(BS_PRICE, S,K,r,sg,T,is_call,contextptr)));
    res.push_back(makevecteur(string2gen("delta", false), bs_compute(BS_DELTA, S,K,r,sg,T,is_call,contextptr)));
    res.push_back(makevecteur(string2gen("gamma", false), bs_compute(BS_GAMMA, S,K,r,sg,T,is_call,contextptr)));
    res.push_back(makevecteur(string2gen("vega",  false), bs_compute(BS_VEGA,  S,K,r,sg,T,is_call,contextptr)));
    res.push_back(makevecteur(string2gen("theta", false), bs_compute(BS_THETA, S,K,r,sg,T,is_call,contextptr)));
    res.push_back(makevecteur(string2gen("rho",   false), bs_compute(BS_RHO,   S,K,r,sg,T,is_call,contextptr)));
    return gen(res, _VECT);
}
static const char _bs_greeks_s []="bs_greeks";
static define_unary_function_eval (__bs_greeks, &_bs_greeks, _bs_greeks_s);
define_unary_function_ptr5(at_bs_greeks, alias_at_bs_greeks, &__bs_greeks, 0, true);

// bs_implied_vol(prix, S, K, r, T [, type])
// Résout prix_BS(sigma) = prix de marché par la méthode de Newton (commande
// newton de Giac) sur le prix symbolique.
gen _bs_implied_vol(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [prix, S, K, r, T] [, \"call\"|\"put\"]");
    vecteur v = *args._VECTptr;
    int sz = int(v.size());
    if (sz < 5 || sz > 6) return gensizeerr("Arguments attendus : [prix, S, K, r, T] [, \"call\"|\"put\"]");
    double price,S,K,r,T;
    if (!sim_todouble(evalf(v[0],1,contextptr), price) || price <= 0) return gensizeerr("prix doit être un réel strictement positif");
    if (!sim_todouble(evalf(v[1],1,contextptr), S) || S <= 0) return gensizeerr("S doit être un réel strictement positif");
    if (!sim_todouble(evalf(v[2],1,contextptr), K) || K <= 0) return gensizeerr("K doit être un réel strictement positif");
    if (!sim_todouble(evalf(v[3],1,contextptr), r)) return gensizeerr("r doit être un réel");
    if (!sim_todouble(evalf(v[4],1,contextptr), T) || T <= 0) return gensizeerr("T doit être un réel strictement positif");
    bool is_call = true;
    if (sz == 6){
        if (v[5].type != _STRNG) return gensizeerr("Le type doit être \"call\" ou \"put\"");
        string s = *v[5]._STRNGptr;
        if (s == "call" || s == "Call" || s == "CALL") is_call = true;
        else if (s == "put" || s == "Put" || s == "PUT") is_call = false;
        else return gensizeerr("Le type doit être \"call\" ou \"put\"");
    }
    double disc = std::exp(-r*T);
    double lo = is_call ? ((S - K*disc > 0.0) ? S - K*disc : 0.0)
                        : ((K*disc - S > 0.0) ? K*disc - S : 0.0);
    double hi = is_call ? S : K*disc;
    if (price <= lo || price >= hi)
        return gensizeerr("prix hors des bornes d'arbitrage : pas de volatilité implicite");
    gen sg_id = identificateur("bs_sg");
    gen P = bs_price_expr(gen(S), gen(K), gen(r), sg_id, gen(T), is_call);
    gen eq = P - gen(price);
    // Point de départ de Newton : le point d'inflexion de C_BS(sigma),
    // sigma0 = sqrt(2|ln(S/K)+rT|/T), où d2C/dsigma2 s'annule (C_BS convexe puis
    // concave). Partir de là assure la convergence (cf. Tankov, vol. implicite).
    // Garde-fou pour le cas dégénéré ln(S/K)+rT = 0 (point d'inflexion en 0).
    double s0 = std::sqrt(2.0 * std::fabs(std::log(S/K) + r*T) / T);
    if (s0 < 1e-3) s0 = 0.2;
    gen sol = _newton(gen(makevecteur(eq, sg_id, gen(s0), gen(1e-12), gen(100)), _SEQ__VECT), contextptr);
    double iv;
    if (!sim_todouble(evalf(sol,1,contextptr), iv) || iv <= 0)
        return gensizeerr("la volatilité implicite n'a pas convergé");
    return iv;
}
static const char _bs_implied_vol_s []="bs_implied_vol";
static define_unary_function_eval (__bs_implied_vol, &_bs_implied_vol, _bs_implied_vol_s);
define_unary_function_ptr5(at_bs_implied_vol, alias_at_bs_implied_vol, &__bs_implied_vol, 0, true);
 



// Construit la table-façade à partir d'une liste de réalisations Y_1..Y_N
static gen mc_table_from_values(const vecteur & Y, GIAC_CONTEXT){
    int N = int(Y.size());
    if (N < 2) return gensizeerr("au moins 2 réalisations sont nécessaires");
    std::vector<double> y; y.reserve(N);
    double sum = 0.0;
    for (int i = 0; i < N; ++i){
        double yi;
        if (!sim_todouble(evalf(Y[i], 1, contextptr), yi))
            return gensizeerr("les réalisations doivent être des réels");
        y.push_back(yi); sum += yi;
    }
    double mean = sum / N;
    double ss = 0.0;
    for (int i = 0; i < N; ++i){ double d = y[i] - mean; ss += d * d; }
    double var = ss / (N - 1);  
    double se  = std::sqrt(var / N);    
    double h   = 1.96 * se;             
    vecteur res;
    res.push_back(makevecteur(string2gen("estimation", false), gen(mean)));
    res.push_back(makevecteur(string2gen("rayon_ic",   false), gen(h)));
    res.push_back(makevecteur(string2gen("ic_bas",     false), gen(mean - h)));
    res.push_back(makevecteur(string2gen("ic_haut",    false), gen(mean + h)));
    res.push_back(makevecteur(string2gen("erreur_std", false), gen(se)));
    res.push_back(makevecteur(string2gen("n",          false), gen(N)));
    return gen(res, _VECT);
}

//  mc_estimate(L) 
// Noyau : prend une liste de réalisations déjà calculées [Y_1, ..., Y_N]
// et renvoie l'estimation de leur espérance avec l'IC à 95%. Ne tire rien, ne connaît aucune loi
gen _mc_estimate(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT)
        return gensizeerr("Argument attendu : une liste de réalisations [Y_1, ..., Y_N]");
    return mc_table_from_values(*args._VECTptr, contextptr);
}
static const char _mc_estimate_s []="mc_estimate";
static define_unary_function_eval (__mc_estimate, &_mc_estimate, _mc_estimate_s);
define_unary_function_ptr5(at_mc_estimate, alias_at_mc_estimate, &__mc_estimate, 0, true);

// mc_mean(g, x, loi, params, N)
// Estime E[g(X)] où X ~ loi(params), par N tirages indépendants. g est une EXPRESSION en la variable libre x. loi est une loi de Giac (normald, uniformd, ...) 
// et params la liste de ses paramètres
gen _mc_mean(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT)
        return gensizeerr("Arguments attendus : [g, x, loi, params, N]");
    vecteur v = *args._VECTptr;
    if (int(v.size()) != 5)
        return gensizeerr("Arguments attendus : [g, x, loi, params, N]");
    gen g   = v[0];
    gen x   = v[1];
    gen loi = v[2];
    gen params = v[3];
    if (x.type != _IDNT)
        return gensizeerr("x doit être une variable (identificateur)");
    int N;
    if (!sim_posint(v[4], N) || N < 2)
        return gensizeerr("N doit être un entier >= 2");

        vecteur rv; rv.push_back(gen(N)); rv.push_back(loi);
    if (params.type == _VECT){
        const vecteur & pv = *params._VECTptr;
        for (size_t i = 0; i < pv.size(); ++i) rv.push_back(pv[i]);
    } else {
        rv.push_back(params);
    }
    gen Xg = _randvector(gen(rv, _SEQ__VECT), contextptr);
    if (Xg.type != _VECT) return gensizeerr("échec du tirage aléatoire");
    const vecteur & X = *Xg._VECTptr;
    vecteur subl = makevecteur(x);
    vecteur Y; Y.reserve(X.size());
    for (size_t i = 0; i < X.size(); ++i){
        gen gi = evalf(subst(g, subl, makevecteur(X[i]), false, contextptr), 1, contextptr);
        double yi;
        if (!sim_todouble(gi, yi))
            return gensizeerr("g(x) doit s'évaluer en un réel sur chaque tirage");
        Y.push_back(gen(yi));
    }
    return mc_table_from_values(Y, contextptr);
}
static const char _mc_mean_s []="mc_mean";
static define_unary_function_eval (__mc_mean, &_mc_mean, _mc_mean_s);
define_unary_function_ptr5(at_mc_mean, alias_at_mc_mean, &__mc_mean, 0, true);

//  mc_bs_price(S, K, r, sigma, T, N [, type])
// APPLICATION : prix d'une option par Monte-Carlo.
gen _mc_bs_price(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT)
        return gensizeerr("Arguments attendus : [S, K, r, sigma, T, N] [, \"call\"|\"put\"]");
    vecteur v = *args._VECTptr;
    int sz = int(v.size());
    if (sz < 6 || sz > 7)
        return gensizeerr("Arguments attendus : [S, K, r, sigma, T, N] [, \"call\"|\"put\"]");
    double S, K, r, sg, T;
    if (!sim_todouble(evalf(v[0],1,contextptr), S)  || S  <= 0) return gensizeerr("S doit être un réel strictement positif");
    if (!sim_todouble(evalf(v[1],1,contextptr), K)  || K  <= 0) return gensizeerr("K doit être un réel strictement positif");
    if (!sim_todouble(evalf(v[2],1,contextptr), r))             return gensizeerr("r doit être un réel");
    if (!sim_todouble(evalf(v[3],1,contextptr), sg) || sg <= 0) return gensizeerr("sigma doit être un réel strictement positif");
    if (!sim_todouble(evalf(v[4],1,contextptr), T)  || T  <= 0) return gensizeerr("T doit être un réel strictement positif");
    int N;
    if (!sim_posint(v[5], N) || N < 2) return gensizeerr("N doit être un entier >= 2");
    bool is_call = true;
    if (sz == 7){
        if (v[6].type != _STRNG) return gensizeerr("Le type doit être \"call\" ou \"put\"");
        string s = *v[6]._STRNGptr;
        if (s == "call" || s == "Call" || s == "CALL") is_call = true;
        else if (s == "put" || s == "Put" || s == "PUT") is_call = false;
        else return gensizeerr("Le type doit être \"call\" ou \"put\"");
    }
    double disc = std::exp(-r * T);
    double drift = (r - 0.5 * sg * sg) * T;
    double vol = sg * std::sqrt(T);
    vecteur Z = sim_normals(N, contextptr);
    vecteur Y; Y.reserve(N);
    for (int i = 0; i < N; ++i){
        double z; if (!sim_todouble(Z[i], z)) z = 0.0;
        double ST = S * std::exp(drift + vol * z);
        double payoff = is_call ? (ST - K) : (K - ST);
        if (payoff < 0.0) payoff = 0.0;
        Y.push_back(gen(disc * payoff));
    }
    return mc_table_from_values(Y, contextptr);
}
static const char _mc_bs_price_s []="mc_bs_price";
static define_unary_function_eval (__mc_bs_price, &_mc_bs_price, _mc_bs_price_s);
define_unary_function_ptr5(at_mc_bs_price, alias_at_mc_bs_price, &__mc_bs_price, 0, true);


//  Réduction de variance : variables antithétiques
 
// mc_mean_antithetic(g, x, N) 
// Estime E[g(Z)], Z ~ N(0,1), par N paires antithétiques (2N évaluations de g)
gen _mc_mean_antithetic(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT)
        return gensizeerr("Arguments attendus : [g, x, N]");
    vecteur v = *args._VECTptr;
    if (int(v.size()) != 3)
        return gensizeerr("Arguments attendus : [g, x, N]");
    gen g = v[0];
    gen x = v[1];
    if (x.type != _IDNT)
        return gensizeerr("x doit être une variable (identificateur)");
    int N;
    if (!sim_posint(v[2], N) || N < 2)
        return gensizeerr("N (nombre de paires) doit être un entier >= 2");
    vecteur Z = sim_normals(N, contextptr);
    vecteur subl = makevecteur(x);
    vecteur Y; Y.reserve(N);
    for (int i = 0; i < N; ++i){
        double zi; if (!sim_todouble(Z[i], zi)) zi = 0.0;
        gen gp = evalf(subst(g, subl, makevecteur(gen(zi)),  false, contextptr), 1, contextptr);
        gen gm = evalf(subst(g, subl, makevecteur(gen(-zi)), false, contextptr), 1, contextptr);
        double yp, ym;
        if (!sim_todouble(gp, yp) || !sim_todouble(gm, ym))
            return gensizeerr("g(x) doit s'évaluer en un réel sur chaque tirage");
        Y.push_back(gen(0.5 * (yp + ym)));
    }
    return mc_table_from_values(Y, contextptr);
}
static const char _mc_mean_antithetic_s []="mc_mean_antithetic";
static define_unary_function_eval (__mc_mean_antithetic, &_mc_mean_antithetic, _mc_mean_antithetic_s);
define_unary_function_ptr5(at_mc_mean_antithetic, alias_at_mc_mean_antithetic, &__mc_mean_antithetic, 0, true);
 
// mc_bs_price_antithetic(S, K, r, sigma, T, N [, type]) 
// Prix d'une option européenne par Monte-Carlo antithétique
gen _mc_bs_price_antithetic(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT)
        return gensizeerr("Arguments attendus : [S, K, r, sigma, T, N] [, \"call\"|\"put\"]");
    vecteur v = *args._VECTptr;
    int sz = int(v.size());
    if (sz < 6 || sz > 7)
        return gensizeerr("Arguments attendus : [S, K, r, sigma, T, N] [, \"call\"|\"put\"]");
    double S, K, r, sg, T;
    if (!sim_todouble(evalf(v[0],1,contextptr), S)  || S  <= 0) return gensizeerr("S doit être un réel strictement positif");
    if (!sim_todouble(evalf(v[1],1,contextptr), K)  || K  <= 0) return gensizeerr("K doit être un réel strictement positif");
    if (!sim_todouble(evalf(v[2],1,contextptr), r))             return gensizeerr("r doit être un réel");
    if (!sim_todouble(evalf(v[3],1,contextptr), sg) || sg <= 0) return gensizeerr("sigma doit être un réel strictement positif");
    if (!sim_todouble(evalf(v[4],1,contextptr), T)  || T  <= 0) return gensizeerr("T doit être un réel strictement positif");
    int N;
    if (!sim_posint(v[5], N) || N < 2) return gensizeerr("N (nombre de paires) doit être un entier >= 2");
    bool is_call = true;
    if (sz == 7){
        if (v[6].type != _STRNG) return gensizeerr("Le type doit être \"call\" ou \"put\"");
        string s = *v[6]._STRNGptr;
        if (s == "call" || s == "Call" || s == "CALL") is_call = true;
        else if (s == "put" || s == "Put" || s == "PUT") is_call = false;
        else return gensizeerr("Le type doit être \"call\" ou \"put\"");
    }
    double disc = std::exp(-r * T);
    double drift = (r - 0.5 * sg * sg) * T;
    double vol = sg * std::sqrt(T);
    vecteur Z = sim_normals(N, contextptr);
    vecteur Y; Y.reserve(N);
    for (int i = 0; i < N; ++i){
        double z; if (!sim_todouble(Z[i], z)) z = 0.0;
        double STp = S * std::exp(drift + vol * z);
        double STm = S * std::exp(drift - vol * z);
        double pp = is_call ? (STp - K) : (K - STp); if (pp < 0.0) pp = 0.0;
        double pm = is_call ? (STm - K) : (K - STm); if (pm < 0.0) pm = 0.0;
        Y.push_back(gen(disc * 0.5 * (pp + pm)));
    }
    return mc_table_from_values(Y, contextptr);
}
static const char _mc_bs_price_antithetic_s []="mc_bs_price_antithetic";
static define_unary_function_eval (__mc_bs_price_antithetic, &_mc_bs_price_antithetic, _mc_bs_price_antithetic_s);
define_unary_function_ptr5(at_mc_bs_price_antithetic, alias_at_mc_bs_price_antithetic, &__mc_bs_price_antithetic, 0, true);


// Estimation des paramètres d'une EDS (problème inverse)

// fit_gbm(trajectoire, T) 
// MBG : S_{k+1} = S_k exp((mu - sigma^2/2) dt + sigma sqrt(dt) Z). 
// sigma_hat = ecart-type(r) / sqrt(dt),   mu_hat = moyenne(r)/dt + sigma_hat^2/2.
// IC : SE(sigma_hat) = sigma_hat / sqrt(2 n) ; SE(mu_hat) = sigma_hat / sqrt(T)

gen _fit_gbm(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [trajectoire, T]");
    vecteur v = *args._VECTptr;
    if (int(v.size()) != 2) return gensizeerr("Arguments attendus : [trajectoire, T]");
    if (v[0].type != _VECT) return gensizeerr("La trajectoire doit être une liste de prix");
    const vecteur & S = *v[0]._VECTptr;
    int npts = int(S.size());
    if (npts < 3) return gensizeerr("trajectoire trop courte (au moins 3 points)");
    double T;
    if (!sim_todouble(evalf(v[1],1,contextptr), T) || T <= 0)
        return gensizeerr("T doit être un réel strictement positif");
    int nret = npts - 1;             
    double dt = T / nret;
    double prev;
    if (!sim_todouble(evalf(S[0],1,contextptr), prev) || prev <= 0)
        return gensizeerr("les prix doivent être strictement positifs");
    std::vector<double> r; r.reserve(nret);
    double sum = 0.0;
    for (int k = 1; k < npts; ++k){
        double cur;
        if (!sim_todouble(evalf(S[k],1,contextptr), cur) || cur <= 0)
            return gensizeerr("les prix doivent être strictement positifs");
        double rk = std::log(cur / prev);
        r.push_back(rk); sum += rk; prev = cur;
    }
    double mbar = sum / nret;
    double ss = 0.0;
    for (int k = 0; k < nret; ++k){ double d = r[k] - mbar; ss += d * d; }
    double s2 = (nret > 1) ? ss / (nret - 1) : 0.0; 
    double sd = std::sqrt(s2);
    double sigma = sd / std::sqrt(dt);
    double mu = mbar / dt + s2 / (2.0 * dt);  
    double zc = 1.96;
    double se_sigma = sigma / std::sqrt(2.0 * nret);
    double se_mu = sigma / std::sqrt(T);
    vecteur res;
    res.push_back(makevecteur(string2gen("mu",    false), gen(mu),    gen(mu    - zc*se_mu),    gen(mu    + zc*se_mu)));
    res.push_back(makevecteur(string2gen("sigma", false), gen(sigma), gen(sigma - zc*se_sigma), gen(sigma + zc*se_sigma)));
    return gen(res, _VECT);
}
static const char _fit_gbm_s []="fit_gbm";
static define_unary_function_eval (__fit_gbm, &_fit_gbm, _fit_gbm_s);
define_unary_function_ptr5(at_fit_gbm, alias_at_fit_gbm, &__fit_gbm, 0, true);
 
// fit_ou(trajectoire, T)
// Ornstein-Uhlenbeck
// b = exp(-alpha dt), a = theta(1-b), Var(eps) = sigma^2 (1-b^2)/(2 alpha).
// On estime a, b par régression linéaire, puis
//    alpha = -ln(b)/dt,  theta = a/(1-b),  sigma = se_res * sqrt(-2 ln(b)/(dt(1-b^2))).
gen _fit_ou(const gen & args, GIAC_CONTEXT){
    if (args.type == _STRNG && args.subtype == -1) return args;
    if (args.type != _VECT) return gensizeerr("Arguments attendus : [trajectoire, T]");
    vecteur v = *args._VECTptr;
    if (int(v.size()) != 2) return gensizeerr("Arguments attendus : [trajectoire, T]");
    if (v[0].type != _VECT) return gensizeerr("La trajectoire doit être une liste");
    const vecteur & X = *v[0]._VECTptr;
    int npts = int(X.size());
    if (npts < 4) return gensizeerr("trajectoire trop courte (au moins 4 points)");
    double T;
    if (!sim_todouble(evalf(v[1],1,contextptr), T) || T <= 0)
        return gensizeerr("T doit être un réel strictement positif");
    int n = npts - 1;                
    double dt = T / n;
    std::vector<double> Z; Z.reserve(npts);
    for (int k = 0; k < npts; ++k){
        double x;
        if (!sim_todouble(evalf(X[k],1,contextptr), x))
            return gensizeerr("la trajectoire doit être réelle");
        Z.push_back(x);
    }
    double sx = 0.0, sy = 0.0;
    for (int k = 0; k < n; ++k){ sx += Z[k]; sy += Z[k+1]; }
    double xbar = sx / n, ybar = sy / n;
    double Sxx = 0.0, Sxy = 0.0;
    for (int k = 0; k < n; ++k){ double dx = Z[k] - xbar; Sxx += dx*dx; Sxy += dx*(Z[k+1] - ybar); }
    if (Sxx <= 0) return gensizeerr("trajectoire dégénérée (X_k constant)");
    double b = Sxy / Sxx;
    double a = ybar - b * xbar;
    double SSE = 0.0;
    for (int k = 0; k < n; ++k){ double e = Z[k+1] - a - b * Z[k]; SSE += e*e; }
    double s2e = (n > 2) ? SSE / (n - 2) : 0.0;   // variance résiduelle
    double se_e = std::sqrt(s2e);
    if (b <= 0.0 || b >= 1.0)
        return gensizeerr("pente hors (0,1) : pas de retour à la moyenne détectable");
    double alpha = -std::log(b) / dt;
    double theta = a / (1.0 - b);
    double sigma = se_e * std::sqrt(-2.0 * std::log(b) / (dt * (1.0 - b*b)));

    double Var_b = s2e / Sxx;
    double Var_a = s2e * (1.0 / n + xbar*xbar / Sxx);
    double Cov_ab = -s2e * xbar / Sxx;
    double SE_b = std::sqrt(Var_b);
    double SE_alpha = SE_b / (b * dt);
    double da = 1.0 / (1.0 - b);
    double db = a / ((1.0 - b) * (1.0 - b));
    double Var_theta = da*da*Var_a + db*db*Var_b + 2.0*da*db*Cov_ab;
    double SE_theta = (Var_theta > 0.0) ? std::sqrt(Var_theta) : 0.0;
    double SE_sigma = (n > 2) ? sigma / std::sqrt(2.0 * (n - 2)) : 0.0;
    double zc = 1.96;
    vecteur res;
    res.push_back(makevecteur(string2gen("alpha", false), gen(alpha), gen(alpha - zc*SE_alpha), gen(alpha + zc*SE_alpha)));
    res.push_back(makevecteur(string2gen("theta", false), gen(theta), gen(theta - zc*SE_theta), gen(theta + zc*SE_theta)));
    res.push_back(makevecteur(string2gen("sigma", false), gen(sigma), gen(sigma - zc*SE_sigma), gen(sigma + zc*SE_sigma)));
    return gen(res, _VECT);
}
static const char _fit_ou_s []="fit_ou";
static define_unary_function_eval (__fit_ou, &_fit_ou, _fit_ou_s);
define_unary_function_ptr5(at_fit_ou, alias_at_fit_ou, &__fit_ou, 0, true);

#ifndef NO_NAMESPACE_GIAC
} // namespace giac
#endif // ndef NO_NAMESPACE_GIAC
